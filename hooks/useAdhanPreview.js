import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { adhanSoundName } from '../constants/adhanConfig';

/**
 * Preview player for the adhan picker.
 *
 * Plays straight out of res/raw, so the recordings exist exactly once in the
 * APK - the same files the notification channels use. Bundling a second copy
 * under assets/ for JS would have doubled the ~18 MB of audio for no benefit.
 *
 * expo-audio treats a *scheme-less* uri as a raw resource name and resolves it
 * with getIdentifier(name, "raw", packageName), so the bare sound name is what
 * we hand it - an android.resource:// URI would take a different code path.
 *
 * Only one clip sounds at a time: tapping the row that is playing pauses it and
 * tapping it again resumes, while picking a different voice/variant releases the
 * old player first.
 */
export default function useAdhanPreview() {
  const playerRef = useRef(null);
  const subscriptionRef = useRef(null);
  // Which voice/variant the live player holds, e.g. "imam_ridha:cutted".
  // Survives a pause, unlike `playingKey`, so resuming reuses the same player.
  const loadedKeyRef = useRef(null);
  // Which voice/variant is currently *sounding*; null while paused or stopped.
  const [playingKey, setPlayingKey] = useState(null);

  const teardown = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    const player = playerRef.current;
    playerRef.current = null;
    loadedKeyRef.current = null;
    if (!player) return;

    // `player.remove()` only drops the player from expo-audio's native registry
    // - it does NOT stop ExoPlayer. Pausing first is what actually silences the
    // clip; `release()` is what frees the shared object. Without both, every tap
    // left an orphaned player sounding and stacked another one on top.
    try {
      player.pause();
    } catch (_) {
      // Player may already be released.
    }
    try {
      player.remove();
    } catch (_) {
      // Ditto.
    }
    try {
      player.release();
    } catch (_) {
      // Ditto.
    }
  }, []);

  // Never leave audio running when the picker closes or the screen unmounts.
  useEffect(() => teardown, [teardown]);

  // Duck other audio rather than seizing it, and don't hold the session open.
  // Done once here instead of inside play(), because awaiting it mid-tap opened
  // a window where two rapid taps each got past the "already playing?" check and
  // both created a player.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    setAudioModeAsync({
      shouldPlayInBackground: false,
      interruptionMode: 'duckOthers',
    }).catch((error) => {
      console.warn('[AdhanPreview] Failed to set audio mode:', error);
    });
  }, []);

  const stop = useCallback(() => {
    teardown();
    setPlayingKey(null);
  }, [teardown]);

  // Synchronous on purpose - see the audio-mode effect above.
  const play = useCallback((voiceId, useFullVersion) => {
    const key = `${voiceId}:${useFullVersion ? 'full' : 'cutted'}`;

    if (Platform.OS !== 'android') {
      // res/raw is Android-only; iOS would need its own bundled copies.
      return;
    }

    // Same track: toggle between pause and resume without reloading it.
    if (loadedKeyRef.current === key && playerRef.current) {
      const player = playerRef.current;
      try {
        if (playingKey === key) {
          player.pause();
          setPlayingKey(null);
        } else {
          player.play();
          setPlayingKey(key);
        }
        return;
      } catch (error) {
        console.warn('[AdhanPreview] Failed to toggle preview:', error);
        stop();
        return;
      }
    }

    // Different track: the old one has to go before the new one starts.
    teardown();

    try {
      const player = createAudioPlayer({ uri: adhanSoundName(voiceId, useFullVersion) });
      playerRef.current = player;
      loadedKeyRef.current = key;

      subscriptionRef.current = player.addListener('playbackStatusUpdate', (status) => {
        // Ignore updates from a player we have already swapped out.
        if (playerRef.current !== player) return;
        if (status.didJustFinish) {
          stop();
        }
      });

      player.play();
      setPlayingKey(key);
    } catch (error) {
      console.warn('[AdhanPreview] Failed to play preview:', error);
      stop();
    }
  }, [playingKey, stop, teardown]);

  const isPlaying = useCallback(
    (voiceId, useFullVersion) => playingKey === `${voiceId}:${useFullVersion ? 'full' : 'cutted'}`,
    [playingKey]
  );

  return { play, stop, isPlaying, playingKey };
}
