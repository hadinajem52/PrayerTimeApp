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
 * Only one clip plays at a time; picking another track (or tapping the one
 * that's playing) stops it.
 */
export default function useAdhanPreview() {
  const playerRef = useRef(null);
  const subscriptionRef = useRef(null);
  // Which voice/variant is currently sounding, e.g. "imam_ridha:cutted"
  const [playingKey, setPlayingKey] = useState(null);

  const teardown = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.remove();
      } catch (_) {
        // Player may already be released.
      }
      playerRef.current = null;
    }
  }, []);

  // Never leave audio running when the picker closes or the screen unmounts.
  useEffect(() => teardown, [teardown]);

  const stop = useCallback(() => {
    teardown();
    setPlayingKey(null);
  }, [teardown]);

  const play = useCallback(async (voiceId, useFullVersion) => {
    const key = `${voiceId}:${useFullVersion ? 'full' : 'cutted'}`;

    // Tapping the track that is already playing acts as pause.
    if (playingKey === key) {
      stop();
      return;
    }

    teardown();

    if (Platform.OS !== 'android') {
      // res/raw is Android-only; iOS would need its own bundled copies.
      return;
    }

    try {
      // Duck other audio rather than seizing it, and don't hold the session open.
      await setAudioModeAsync({
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });

      const player = createAudioPlayer({ uri: adhanSoundName(voiceId, useFullVersion) });
      playerRef.current = player;
      setPlayingKey(key);

      subscriptionRef.current = player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          stop();
        }
      });

      player.play();
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
