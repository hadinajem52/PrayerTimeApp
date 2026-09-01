/**
 * Central place for all notification-related magic strings.
 * Import from here instead of scattering literals across files.
 */

// ── Android notification channel IDs ─────────────────────────────────────────
// The adhan channels are generated per voice/variant - see constants/adhanConfig
// and utils/notificationChannels. The LEGACY id is the retired single-sound
// channel, kept only so the v3 migration can clean it up.
export const NOTIF_CHANNEL_SOUND_LEGACY = 'prayer-channel-sound-v2';
export const NOTIF_CHANNEL_DEFAULT = 'prayer-channel-default-v2';
export const NOTIF_CHANNEL_BACKGROUND = 'prayer-channel-background-v1';
// Silent, MIN-importance channel for the persistent next-prayer countdown.
export const NOTIF_CHANNEL_COUNTDOWN = 'prayer-countdown-v1';

// ── Special trigger notification IDs ────────────────────────────────────────
export const NOTIF_REFRESH_ID = 'daily-refresh';
// The ongoing countdown, plus the silent trigger that advances it to the next
// prayer the moment the current one arrives.
export const NOTIF_COUNTDOWN_ID = 'prayer-countdown';
export const NOTIF_COUNTDOWN_REFRESH_ID = 'prayer-countdown-refresh';

// ── Prefix used for individual prayer trigger IDs (prayer_YYYYMMDD_key) ─────
export const NOTIF_PRAYER_ID_PREFIX = 'prayer_';

// ── Rolling scheduling window ────────────────────────────────────────────────
export const NOTIF_ROLLING_WINDOW_DAYS = 7;

// ── Mirror of what is currently scheduled ───────────────────────────────────
// { [notificationId]: { timestamp, channelId } }. Stands in for the fields the
// scheduler used to read back out of notifee.getTriggerNotifications(), which
// cannot be called safely - see utils/scheduledTriggerStore.
export const NOTIF_SCHEDULE_META_KEY = 'notif_schedule_meta_v1';

// ── AsyncStorage keys used to guard the one-time channel migrations ─────────
export const NOTIF_MIGRATED_V2_KEY = 'notif_migrated_v2';
// v3 moved every install off the single adhan channel onto per-voice channels.
export const NOTIF_MIGRATED_V3_KEY = 'notif_migrated_v3';

// ── AsyncStorage keys mirrored for the background event handler ─────────────
export const BG_STORAGE_KEYS = {
  SELECTED_LOCATION: 'selectedLocation',
  ENABLED_PRAYERS:   'enabledPrayers',
  LANGUAGE:          'language',
  USE_PRAYER_SOUND:  'usePrayerSound',
  ADHAN_VOICE:       'adhanVoice',
  ADHAN_FULL:        'adhanFullVersion',
  SHOW_COUNTDOWN:    'showCountdownNotification',
};

export const BG_PRAYER_TIMES_KEY = 'updatedPrayerTimes';
