package com.hnjm123.ShiaPrayerLeb;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.app.PendingIntent;
import android.os.Build;
import android.widget.RemoteViews;

public class PrayerWidgetSmallProvider extends AppWidgetProvider {
    private static final String ACTION_UPDATE_NOW = "com.hnjm123.ShiaPrayerLeb.action.UPDATE_NOW_SMALL";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
        // Ensure a next alarm is scheduled (in case only small widget exists)
        PrayerWidgetProvider.scheduleNextUpdate(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, android.os.Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        updateAppWidget(context, appWidgetManager, appWidgetId);
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Reuse existing logic from large widget
    boolean dark = PrayerWidgetProvider.isDarkModeEnabled(context);
    int layoutId = dark ? R.layout.prayer_widget_small_dark : R.layout.prayer_widget_small;
    RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);

        // Adjust text sizes if very constrained
        try {
            android.os.Bundle opts = appWidgetManager.getAppWidgetOptions(appWidgetId);
            int minW = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH); // dp
            int minH = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT); // dp
            if (minW < 110 || minH < 60) {
                views.setTextViewTextSize(R.id.prayer_name, android.util.TypedValue.COMPLEX_UNIT_SP, 13f);
                views.setTextViewTextSize(R.id.prayer_time, android.util.TypedValue.COMPLEX_UNIT_SP, 16f);
                views.setTextViewTextSize(R.id.countdown_chronometer, android.util.TypedValue.COMPLEX_UNIT_SP, 10f);
            } else if (minW > 150) {
                views.setTextViewTextSize(R.id.prayer_name, android.util.TypedValue.COMPLEX_UNIT_SP, 17f);
                views.setTextViewTextSize(R.id.prayer_time, android.util.TypedValue.COMPLEX_UNIT_SP, 20f);
                views.setTextViewTextSize(R.id.countdown_chronometer, android.util.TypedValue.COMPLEX_UNIT_SP, 12f);
            }
        } catch (Exception ignored) {}

        PrayerWidgetProvider.NextPrayerInfo info;
        try {
            info = PrayerWidgetProvider.provideNextPrayerInfo(context);
        } catch (Exception e) {
            info = new PrayerWidgetProvider.NextPrayerInfo("الصبح", "--:--", "", 0L);
        }

        if (info != null) {
            views.setTextViewText(R.id.prayer_name, info.name);
            views.setTextViewText(R.id.prayer_time, info.time);
            long nowElapsed = android.os.SystemClock.elapsedRealtime();
            long base = nowElapsed + info.millisUntil;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                views.setChronometerCountDown(R.id.countdown_chronometer, true);
            }
            views.setChronometer(R.id.countdown_chronometer, base, "%s", true);
        }

        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        views.setOnClickPendingIntent(R.id.prayer_widget_container, pi);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent != null && ACTION_UPDATE_NOW.equals(intent.getAction())) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            int[] ids = manager.getAppWidgetIds(new android.content.ComponentName(context, PrayerWidgetSmallProvider.class));
            for (int id : ids) updateAppWidget(context, manager, id);
            // Also refresh large widgets so both sizes stay synchronized
            int[] largeIds = manager.getAppWidgetIds(new android.content.ComponentName(context, PrayerWidgetProvider.class));
            for (int id : largeIds) PrayerWidgetProvider.updateAppWidget(context, manager, id);
            PrayerWidgetProvider.scheduleNextUpdate(context);
        }
    }
}
