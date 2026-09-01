import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTIF_SCHEDULE_META_KEY } from '../constants/notificationConfig';

/**
 * Our own mirror of the two facts the scheduler needs about each pending prayer
 * trigger: when it fires, and which channel it goes out on.
 *
 * These used to come from notifee.getTriggerNotifications(), which is no longer
 * safe to call. That API hands every stored notification back through
 * Arguments.fromBundle on the native side, and notifee persists those
 * notifications as raw marshalled Parcel bytes in a SQLite BLOB
 * (notifee_core_database, table work_data). Android explicitly does not
 * guarantee that a marshalled Parcel stays readable across platform versions,
 * so every row written before a device took the Android 16 upgrade throws
 * BadParcelableException on read - on notifee's own executor thread, where no
 * JS try/catch can reach it. See NotifeeParcelGuard.kt for the other half of
 * the fix.
 *
 * getTriggerNotificationIds() returns plain strings and never touches the
 * BLOBs, so the ids stay authoritative and this store supplies the rest.
 *
 * Pure module (no hooks) so onBackgroundEvent can drive it too.
 */

/**
 * Read the mirror. Always resolves to an object - a missing or corrupt entry
 * just means every id looks "changed" and gets rewritten once, which is
 * harmless because scheduling is idempotent on the id.
 */
export async function readScheduleMeta() {
  try {
    const raw = await AsyncStorage.getItem(NOTIF_SCHEDULE_META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('[Notification] Could not read schedule metadata:', error);
    return {};
  }
}

/** Replace the mirror with what is actually scheduled now. */
export async function writeScheduleMeta(meta) {
  try {
    await AsyncStorage.setItem(NOTIF_SCHEDULE_META_KEY, JSON.stringify(meta));
  } catch (error) {
    console.warn('[Notification] Could not persist schedule metadata:', error);
  }
}
