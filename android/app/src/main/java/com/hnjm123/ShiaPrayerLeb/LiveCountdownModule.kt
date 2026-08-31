package com.hnjm123.ShiaPrayerLeb

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.os.Build
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap

/**
 * Posts the next-prayer countdown as an Android 16 "promoted ongoing"
 * notification - the thing that earns a live chip in the status bar next to the
 * clock, rather than only a row in the pulled-down shade.
 *
 * notifee has no API for any of this (no shortCriticalText, no
 * FLAG_PROMOTED_ONGOING), so this single notification is built with the
 * framework Notification.Builder directly. Everything else - working out which
 * prayer is next, and arming the trigger that advances the countdown - stays in
 * JS; see utils/countdownNotification.js.
 *
 * Android 15 and below cannot do this at all: a third-party app may put an icon
 * in the status bar but never text. `isSupported()` reports false there and the
 * JS side falls back to the plain notifee notification.
 */
class LiveCountdownModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "LiveCountdown"

    private val manager: NotificationManager
        get() = reactApplicationContext
            .getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    /** Android 16 is the first release where a third-party chip is possible. */
    @ReactMethod
    fun isSupported(promise: Promise) {
        promise.resolve(Build.VERSION.SDK_INT >= PROMOTED_MIN_SDK)
    }

    /**
     * Whether the user still has Live Updates switched on for this app. They can
     * revoke it per-app in system notification settings, in which case the
     * notification is posted as an ordinary ongoing one.
     */
    @ReactMethod
    fun canPromote(promise: Promise) {
        if (Build.VERSION.SDK_INT < PROMOTED_MIN_SDK) {
            promise.resolve(false)
            return
        }
        promise.resolve(
            try {
                manager.canPostPromotedNotifications()
            } catch (e: Throwable) {
                Log.w(TAG, "canPostPromotedNotifications() unavailable", e)
                false
            }
        )
    }

    /**
     * Post (or silently replace) the countdown chip.
     *
     * `options` carries `title`, `body`, `timestamp` (epoch ms of the prayer)
     * and `shortText` (what the status bar chip shows if it will not draw the
     * chronometer itself).
     *
     * Resolves with what actually happened, so JS can log it and fall back:
     * `{ supported, posted, promotable, promoted, canPost }`. `promoted` is read
     * back off the built notification - the system clears the flag when it
     * declines to promote, so this is the honest answer rather than our request.
     */
    @ReactMethod
    fun show(options: ReadableMap, promise: Promise) {
        if (Build.VERSION.SDK_INT < PROMOTED_MIN_SDK) {
            promise.resolve(result(supported = false, posted = false))
            return
        }

        try {
            val context = reactApplicationContext
            ensureChannel()

            val title = options.getStringOr("title", "")
            val body = options.getStringOr("body", "")
            val shortText = options.getStringOr("shortText", "")
            // ReadableMap has no getLong; epoch ms exceeds Int, so it arrives as
            // a double and is exact well past any date we care about.
            val timestamp = if (options.hasKey("timestamp")) {
                options.getDouble("timestamp").toLong()
            } else {
                System.currentTimeMillis()
            }

            val builder = Notification.Builder(context, CHANNEL_ID)
                .setSmallIcon(smallIconResId())
                .setContentTitle(title)
                .setContentText(body)
                .setColor(context.getColor(R.color.colorPrimary))
                // Ongoing is a hard requirement for promotion, and it also stops
                // the countdown being swiped away by accident.
                .setOngoing(true)
                .setAutoCancel(false)
                .setOnlyAlertOnce(true)
                .setContentIntent(launchIntent())
                // The same three fields the shade uses to tick the digits for
                // free. If the status bar chip honours them we get a live
                // countdown at no cost; if it does not, it falls back to
                // shortCriticalText below.
                .setShowWhen(true)
                .setWhen(timestamp)
                .setUsesChronometer(true)
                .setChronometerCountDown(true)

            if (shortText.isNotEmpty()) {
                builder.setShortCriticalText(shortText)
            }

            val notification = builder.build()
            // Asking for the chip. The system strips this flag again if the
            // notification is not eligible or the user has turned Live Updates
            // off for us, which is why we read it back rather than assume.
            notification.flags = notification.flags or Notification.FLAG_PROMOTED_ONGOING

            val promotable = try {
                notification.hasPromotableCharacteristics()
            } catch (e: Throwable) {
                false
            }

            manager.notify(NOTIFICATION_TAG, NOTIFICATION_ID, notification)

            val promoted = (notification.flags and Notification.FLAG_PROMOTED_ONGOING) != 0
            Log.d(TAG, "posted countdown chip: promotable=$promotable promoted=$promoted")

            promise.resolve(
                result(
                    supported = true,
                    posted = true,
                    promotable = promotable,
                    promoted = promoted,
                    canPost = manager.canPostPromotedNotifications(),
                )
            )
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to post countdown chip", e)
            promise.resolve(result(supported = true, posted = false))
        }
    }

    /** Take the chip down. Safe to call when nothing is showing. */
    @ReactMethod
    fun hide(promise: Promise) {
        try {
            manager.cancel(NOTIFICATION_TAG, NOTIFICATION_ID)
        } catch (e: Throwable) {
            Log.w(TAG, "Failed to cancel countdown chip", e)
        }
        promise.resolve(null)
    }

    /**
     * Its own channel, separate from notifee's `prayer-countdown-v1`. That one is
     * MIN importance, which keeps a notification out of the status bar entirely -
     * exactly what we are trying to undo here. DEFAULT with the sound and
     * vibration explicitly cleared stays just as quiet while remaining eligible.
     */
    private fun ensureChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Next Prayer Countdown (Live)",
            NotificationManager.IMPORTANCE_DEFAULT,
        ).apply {
            setSound(null, null)
            enableVibration(false)
            enableLights(false)
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    private fun smallIconResId(): Int {
        val context = reactApplicationContext
        val id = context.resources.getIdentifier(
            "notification_icon", "drawable", context.packageName
        )
        return if (id != 0) id else context.applicationInfo.icon
    }

    private fun launchIntent(): PendingIntent? {
        val context = reactApplicationContext
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            ?: return null
        return PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }

    private fun result(
        supported: Boolean,
        posted: Boolean,
        promotable: Boolean = false,
        promoted: Boolean = false,
        canPost: Boolean = false,
    ): WritableMap = Arguments.createMap().apply {
        putBoolean("supported", supported)
        putBoolean("posted", posted)
        putBoolean("promotable", promotable)
        putBoolean("promoted", promoted)
        putBoolean("canPost", canPost)
    }

    private fun ReadableMap.getStringOr(key: String, fallback: String): String =
        if (hasKey(key)) getString(key) ?: fallback else fallback

    companion object {
        private const val TAG = "LiveCountdown"
        /** Android 16. Named rather than VERSION_CODES so older SDKs still build. */
        private const val PROMOTED_MIN_SDK = 36
        private const val CHANNEL_ID = "prayer-countdown-live-v1"
        private const val NOTIFICATION_TAG = "prayer-countdown-live"
        private const val NOTIFICATION_ID = 8811
    }
}
