import notifee, { AndroidImportance } from '@notifee/react-native';
import {
  ADHAN_CHANNEL_PREFIX,
  adhanChannelId,
  adhanSoundName,
  getAdhanVoiceName,
} from '../constants/adhanConfig';
import { NOTIF_CHANNEL_DEFAULT, NOTIF_CHANNEL_BACKGROUND } from '../constants/notificationConfig';

/**
 * Android freezes a channel's sound at creation time, so the selected adhan has
 * to be expressed as a *different channel* rather than a different sound on one
 * channel. Channels are created lazily - only the ones a user actually picks
 * ever show up in their system notification settings.
 *
 * Pure module (no hooks) so onBackgroundEvent can use it too.
 */

/** Create the channel for this voice/variant if needed, and return its id. */
export async function ensureAdhanChannel(voiceId, useFullVersion, language = 'en') {
  const channelId = adhanChannelId(voiceId, useFullVersion);

  // createChannel is idempotent - a second call with the same id is a no-op
  // apart from refreshing the display name.
  await notifee.createChannel({
    id: channelId,
    name: `Prayer Notifications (${getAdhanVoiceName(voiceId, language)})`,
    importance: AndroidImportance.MAX,
    sound: adhanSoundName(voiceId, useFullVersion),
    vibration: true,
  });

  return channelId;
}

/** The channel used when the user turns the adhan off entirely. */
export async function ensureDefaultSoundChannel() {
  await notifee.createChannel({
    id: NOTIF_CHANNEL_DEFAULT,
    name: 'Prayer Notifications (Default)',
    importance: AndroidImportance.MAX,
    vibration: true,
    sound: 'default',
  });
  return NOTIF_CHANNEL_DEFAULT;
}

/** Low-priority channel that only exists to wake the rolling scheduler. */
export async function ensureBackgroundChannel() {
  await notifee.createChannel({
    id: NOTIF_CHANNEL_BACKGROUND,
    name: 'Prayer Background Refresh',
    importance: AndroidImportance.MIN,
    vibration: false,
    badge: false,
  });
  return NOTIF_CHANNEL_BACKGROUND;
}

/**
 * Resolve the channel a prayer notification should go out on, creating it if
 * this is the first time the user has picked that sound.
 */
export async function resolveNotificationChannel(soundConfig = {}, language = 'en') {
  const { usePrayerSound = true, adhanVoice, adhanFullVersion = false } = soundConfig;

  if (!usePrayerSound || !adhanVoice) {
    return ensureDefaultSoundChannel();
  }
  return ensureAdhanChannel(adhanVoice, adhanFullVersion, language);
}

/**
 * Drop adhan channels the user has moved away from, so switching voices a few
 * times doesn't litter their system notification settings with dead entries.
 * Never touches the channel currently in use.
 */
export async function pruneUnusedAdhanChannels(activeChannelId) {
  try {
    const channels = await notifee.getChannels();
    const stale = channels.filter(
      c => c.id.startsWith(ADHAN_CHANNEL_PREFIX) && c.id !== activeChannelId
    );
    for (const channel of stale) {
      await notifee.deleteChannel(channel.id);
    }
    if (stale.length > 0) {
      console.log('[Channels] Removed', stale.length, 'unused adhan channel(s)');
    }
  } catch (error) {
    console.warn('[Channels] Failed to prune unused channels:', error);
  }
}
