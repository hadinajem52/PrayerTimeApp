package com.hnjm123.ShiaPrayerLeb

import android.content.Context
import android.os.Build
import android.util.Log

/**
 * Drops notifee's persisted trigger store when the platform version changes.
 *
 * notifee keeps every scheduled notification in a Room database
 * (`notifee_core_database`, table `work_data`) with the notification and its
 * trigger stored as BLOBs of raw marshalled `Parcel` bytes. Android is explicit
 * that this is not allowed: the output of `Parcel.marshall()` "must not be
 * placed in any kind of persistent storage" because the representation is tuned
 * for local IPC and makes no compatibility guarantee across platform versions.
 *
 * So when a device takes an OS upgrade, every row written under the previous
 * version can become unreadable, and the next read throws
 * BadParcelableException out of `Bundle.unparcel()`. That happens on notifee's
 * own executor, so it is an uncaught exception on a background thread - it
 * takes the process down and no JS `try`/`catch` can intervene. Android 16 is
 * where this started showing up in the field (upstream notifee issue #1233,
 * closed unresolved; the project was archived in April 2026, so there is no fix
 * coming).
 *
 * Wiping the store costs nothing: the whole schedule is re-derived from the
 * prayer data every time the app is opened or the nightly refresh fires, and
 * re-scheduling reuses the same notification ids, so the replaced alarms line
 * up with the rows that come back.
 *
 * Runs from `attachBaseContext`, which is the earliest application code in the
 * process - before any ContentProvider, and so before notifee's `InitProvider`.
 */
object NotifeeParcelGuard {

    private const val TAG = "NotifeeParcelGuard"
    private const val PREFS = "notifee_parcel_guard"
    private const val KEY_LAST_SDK = "last_seen_sdk_int"
    private const val DATABASE = "notifee_core_database"

    /** No recorded platform yet: a fresh install, or the first run of this build. */
    private const val UNSET = -1

    /**
     * Wipe the store if the platform has moved since it was written.
     *
     * The first run after this ships wipes unconditionally, because installs
     * that already crossed an OS upgrade are carrying the bad rows right now
     * and have no marker to compare against. On a fresh install there is
     * nothing to delete and this is a no-op.
     */
    fun purgeIfPlatformChanged(context: Context) {
        try {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val lastSeen = prefs.getInt(KEY_LAST_SDK, UNSET)
            val current = Build.VERSION.SDK_INT
            if (lastSeen == current) return

            // deleteDatabase takes the -wal and -shm sidecars with it.
            val deleted = context.deleteDatabase(DATABASE)
            prefs.edit().putInt(KEY_LAST_SDK, current).apply()

            Log.i(
                TAG,
                "Platform changed ($lastSeen -> $current); notifee trigger store " +
                    if (deleted) "dropped - the schedule will be rebuilt." else "was already absent."
            )
        } catch (e: Throwable) {
            // Never let this stop the app starting: the crash it prevents is
            // survivable, failing to boot is not.
            Log.w(TAG, "Could not check or drop the notifee trigger store", e)
        }
    }
}
