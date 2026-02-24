package com.hnjm123.ShiaPrayerLeb

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.hnjm123.ShiaPrayerLeb.workers.PrayerTimeUpdateWorker
import java.util.Calendar

class PrayerUpdateAlarmReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            ACTION_UPDATE,
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED -> {
                Log.d(TAG, "Alarm triggered (action=${intent.action}); enqueueing update worker")

                if (intent.action == ACTION_UPDATE) {
                    // Enqueue the actual update work
                    val work = OneTimeWorkRequestBuilder<PrayerTimeUpdateWorker>().build()
                    WorkManager.getInstance(context).enqueueUniqueWork(
                        "alarm_prayer_time_update",
                        ExistingWorkPolicy.REPLACE,
                        work
                    )
                }

                // Always reschedule the next alarm (also handles boot / reinstall)
                scheduleNextAlarm(context)
            }
        }
    }

    companion object {
        private const val TAG = "PrayerAlarm"
        const val ACTION_UPDATE = "com.hnjm123.ShiaPrayerLeb.action.PRAYER_TIME_UPDATE"
        private const val REQUEST_CODE = 20250

        /**
         * Schedule (or reschedule) the exact alarm for the next 12:30 AM.
         * Safe to call multiple times — always replaces the previous pending intent.
         */
        fun scheduleNextAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val pendingIntent = buildPendingIntent(context)

            // Calculate next 12:30 AM
            val target = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 30)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                // If we're already past 12:30 AM today, aim for tomorrow
                if (System.currentTimeMillis() >= timeInMillis) {
                    add(Calendar.DAY_OF_YEAR, 1)
                }
            }

            val triggerAtMillis = target.timeInMillis
            val deltaH = (triggerAtMillis - System.currentTimeMillis()) / 3_600_000
            val deltaM = ((triggerAtMillis - System.currentTimeMillis()) / 60_000) % 60
            Log.d(TAG, "Next alarm in ~${deltaH}h ${deltaM}m at ${target.time}")

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (alarmManager.canScheduleExactAlarms()) {
                        alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent
                        )
                        Log.d(TAG, "Exact alarm scheduled")
                    } else {
                        // Permission not granted — use inexact but still clock-anchored alarm
                        alarmManager.setAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent
                        )
                        Log.w(TAG, "Exact alarm permission not granted; using inexact alarm")
                    }
                } else {
                    alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent
                    )
                    Log.d(TAG, "Exact alarm scheduled (pre-S)")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to schedule alarm", e)
            }
        }

        /**
         * Cancel any pending alarm. Call when you want to stop the daily updates.
         */
        fun cancelAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            alarmManager.cancel(buildPendingIntent(context))
            Log.d(TAG, "Alarm cancelled")
        }

        private fun buildPendingIntent(context: Context): PendingIntent {
            val intent = Intent(context, PrayerUpdateAlarmReceiver::class.java).apply {
                action = ACTION_UPDATE
            }
            return PendingIntent.getBroadcast(
                context,
                REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }
    }
}
