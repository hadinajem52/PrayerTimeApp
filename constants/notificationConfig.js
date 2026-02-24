/**
 * Central place for all notification-related magic strings.
 * Import from here instead of scattering literals across files.
 */

// ── Android notification channel IDs ─────────────────────────────────────────
export const NOTIF_CHANNEL_SOUND   = 'prayer-channel-sound-v2';
export const NOTIF_CHANNEL_DEFAULT = 'prayer-channel-default-v2';

// ── Special trigger notification ID ─────────────────────────────────────────
export const NOTIF_REFRESH_ID = 'daily-refresh';

// ── Prefix used for individual prayer trigger IDs (prayer_YYYYMMDD_key) ─────
export const NOTIF_PRAYER_ID_PREFIX = 'prayer_';

// ── AsyncStorage key used to guard the one-time channel migration ────────────
export const NOTIF_MIGRATED_V2_KEY = 'notif_migrated_v2';

// ── AsyncStorage keys mirrored for the background event handler ─────────────
export const BG_STORAGE_KEYS = {
  SELECTED_LOCATION: 'selectedLocation',
  ENABLED_PRAYERS:   'enabledPrayers',
  LANGUAGE:          'language',
  USE_PRAYER_SOUND:  'usePrayerSound',
};
