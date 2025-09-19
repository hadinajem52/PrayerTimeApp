package com.hnjm123.ShiaPrayerLeb;

import android.app.PendingIntent;
import android.app.AlarmManager;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.ComponentName;
import android.os.Build;
import android.widget.RemoteViews;
import org.json.JSONObject;
import org.json.JSONArray;
import java.util.Locale;
import java.util.Calendar;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.io.FileInputStream;
import java.io.InputStream;

public class PrayerWidgetProvider extends AppWidgetProvider {

    private static final String REACT_NATIVE_PREFS = "RCTAsyncLocalStorage_V1";
    private static final String SETTINGS_KEY = "settings";
    private static final String APP_PREFS = "PrayerAppPrefs";
    private static final String SELECTED_LOCATION_PREF = "SELECTED_LOCATION";
    private static final String TIME_FORMAT_PREF = "TIME_FORMAT"; // "12h" | "24h"
    private static final String ARABIC_NUMERALS_PREF = "USE_AR_NUMS"; // optional future
    private static final String DARK_MODE_PREF = "DARK_MODE"; // optional

    private static final String ACTION_UPDATE_NOW = "com.hnjm123.ShiaPrayerLeb.action.UPDATE_NOW";
    private static final int REQ_CODE_UPDATE = 10042;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
        // After updating, schedule the next exact update at the next prayer boundary
        scheduleNextUpdate(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, android.os.Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        updateAppWidget(context, appWidgetManager, appWidgetId);
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        WidgetSettings settings = loadSettings(context);

        // Determine responsive layout choice based on current widget bounds
        int layoutId;
        try {
            android.os.Bundle opts = appWidgetManager.getAppWidgetOptions(appWidgetId);
            int minW = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH); // dp
            int minH = opts.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT); // dp
            boolean compact = (minW < 180) || (minH < 100); // heuristic breakpoint
            if (compact) {
                layoutId = settings.darkMode ? R.layout.prayer_widget_compact_dark : R.layout.prayer_widget_compact;
            } else {
                layoutId = settings.darkMode ? R.layout.prayer_widget_dark : R.layout.prayer_widget;
            }
        } catch (Exception e) {
            layoutId = settings.darkMode ? R.layout.prayer_widget_dark : R.layout.prayer_widget;
        }
        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);

        try {
            NextPrayerInfo nextPrayer = getNextPrayerInfo(context);

            if (nextPrayer != null) {
                views.setTextViewText(R.id.prayer_name, nextPrayer.name);
                views.setTextViewText(R.id.prayer_time, nextPrayer.time);
                views.setTextViewText(R.id.city_name, nextPrayer.city);

                // Configure chronometer for a ticking countdown to next prayer (HH:MM:SS)
                long nowElapsed = android.os.SystemClock.elapsedRealtime();
                long countdownMillis = nextPrayer.millisUntil;
                long base = nowElapsed + countdownMillis; // For countdown mode, base is future moment
                // Enable real countdown (no leading minus) on API 24+; otherwise fallback to static formatted text later if needed
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    views.setChronometerCountDown(R.id.countdown_chronometer, true);
                }
                views.setChronometer(R.id.countdown_chronometer, base, "%s", true);

                // progress toward next prayer
                int progress = computeProgressPercent(nextPrayer);
                views.setProgressBar(R.id.progress, 100, progress, false);
            } else {
                views.setTextViewText(R.id.prayer_name, "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...");
                views.setTextViewText(R.id.prayer_time, "--:--");
                views.setTextViewText(R.id.city_name, "");
                // stop chronometer
                views.setChronometer(R.id.countdown_chronometer, android.os.SystemClock.elapsedRealtime(), "%s", false);
                views.setProgressBar(R.id.progress, 100, 0, false);
            }
        } catch (Exception e) {
            views.setTextViewText(R.id.prayer_name, "\u062e\u0637\u0623");
            views.setTextViewText(R.id.prayer_time, "--:--");
            views.setTextViewText(R.id.city_name, "");
            views.setChronometer(R.id.countdown_chronometer, android.os.SystemClock.elapsedRealtime(), "%s", false);
            views.setProgressBar(R.id.progress, 100, 0, false);
        }

        // Create an intent to open the main app when widget is tapped
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.prayer_widget_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent != null ? intent.getAction() : null;

        if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(action)
                || ACTION_UPDATE_NOW.equals(action)
                || Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_DATE_CHANGED.equals(action)) {

            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName componentName = new ComponentName(context, PrayerWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(componentName);
            for (int id : ids) {
                updateAppWidget(context, manager, id);
            }
            // Also update small widget variant so both sizes stay in sync
            try {
                ComponentName smallComp = new ComponentName(context, PrayerWidgetSmallProvider.class);
                int[] smallIds = manager.getAppWidgetIds(smallComp);
                for (int sid : smallIds) {
                    PrayerWidgetSmallProvider.updateAppWidget(context, manager, sid);
                }
            } catch (Exception ignored) {}
            scheduleNextUpdate(context);
        }
    }

    @Override
    public void onEnabled(Context context) {
        // When the first widget is created
        scheduleNextUpdate(context);
    }

    @Override
    public void onDisabled(Context context) {
        // When the last widget is removed
        cancelScheduledUpdate(context);
    }

    private static int computeProgressPercent(NextPrayerInfo nextPrayer) {
        // We need duration from previous prayer start to this next one.
        // As we currently only return millisUntil next prayer, approximate by assuming equal spacing
        // if we don't know previous. For better accuracy, extend NextPrayerInfo to include prev timestamp.
        if (nextPrayer.totalWindowMillis <= 0) return 0;
        long done = nextPrayer.totalWindowMillis - nextPrayer.millisUntil;
        if (done < 0) done = 0;
        int pct = (int) Math.round((done * 100.0) / nextPrayer.totalWindowMillis);
        if (pct < 0) pct = 0;
        if (pct > 100) pct = 100;
        return pct;
    }

    private static NextPrayerInfo getNextPrayerInfo(Context context) {
        try {
            WidgetSettings s = loadSettings(context);

            String prayerTimesJson = loadPrayerTimes(context);
            if (prayerTimesJson == null) {
                return new NextPrayerInfo("\u0627\u0644\u0641\u062c\u0631", "05:30", displayCity(s.selectedLocation), 0L);
            }

            JSONObject prayerTimes = new JSONObject(prayerTimesJson);
            JSONArray cityData = prayerTimes.optJSONArray(s.selectedLocation);

            if (cityData == null || cityData.length() == 0) {
                // fallback to beirut
                s.selectedLocation = "beirut";
                cityData = prayerTimes.optJSONArray("beirut");
            }
            if (cityData == null) {
                return new NextPrayerInfo("\u0627\u0644\u0641\u062c\u0631", "05:30", displayCity(s.selectedLocation), 0L);
            }

            int todayIndex = getTodayIndex(cityData);
            JSONObject todayPrayers = cityData.getJSONObject(todayIndex);

            // JSON uses shuruq (not sunrise)
            String[] prayerOrder = {"fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"};
            String[] prayerNames = {"\u0627\u0644\u0635\u0628\u062d", "\u0627\u0644\u0634\u0631\u0648\u0642", "\u0627\u0644\u0638\u0647\u0631", "\u0627\u0644\u0639\u0635\u0631", "\u0627\u0644\u0645\u063a\u0631\u0628", "\u0627\u0644\u0639\u0634\u0627\u0621"};
            
            Calendar now = Calendar.getInstance();
            int currentHour = now.get(Calendar.HOUR_OF_DAY);
            int currentMinute = now.get(Calendar.MINUTE);
            int currentSecond = now.get(Calendar.SECOND);
            int currentTimeInSeconds = currentHour * 3600 + currentMinute * 60 + currentSecond;

            for (int i = 0; i < prayerOrder.length; i++) {
                String prayerTimeStr = todayPrayers.optString(prayerOrder[i], null);
                if (prayerTimeStr == null || prayerTimeStr.trim().isEmpty()) continue;
                int prayerTimeInSeconds = parseTimeToSeconds(prayerTimeStr);
                
                if (prayerTimeInSeconds > currentTimeInSeconds) {
                    String formattedTime = formatTime(prayerTimeStr, s.timeFormat24h, s.arabicNumerals);
                    long millisUntil = (prayerTimeInSeconds - currentTimeInSeconds) * 1000L;
                    // determine previous prayer time to compute total window
                    int prevIndex = i - 1;
                    int prevSecs;
                    if (prevIndex >= 0) {
                        String prevStr = todayPrayers.optString(prayerOrder[prevIndex], null);
                        // if missing, fallback to earlier available
                        while ((prevStr == null || prevStr.trim().isEmpty()) && prevIndex > 0) {
                            prevIndex--;
                            prevStr = todayPrayers.optString(prayerOrder[prevIndex], null);
                        }
                        if (prevStr == null || prevStr.trim().isEmpty()) {
                            // fallback to yesterday isha
                            int yIndex = (todayIndex - 1 + cityData.length()) % cityData.length();
                            JSONObject yPrayers = cityData.getJSONObject(yIndex);
                            String yIsha = yPrayers.optString("isha", yPrayers.optString("maghrib", "18:00"));
                            prevSecs = parseTimeToSeconds(yIsha) - 24*3600; // yesterday seconds baseline
                        } else {
                            prevSecs = parseTimeToSeconds(prevStr);
                        }
                    } else {
                        // previous is yesterday isha
                        int yIndex = (todayIndex - 1 + cityData.length()) % cityData.length();
                        JSONObject yPrayers = cityData.getJSONObject(yIndex);
                        String yIsha = yPrayers.optString("isha", yPrayers.optString("maghrib", "18:00"));
                        prevSecs = parseTimeToSeconds(yIsha) - 24*3600; // map to negative seconds to represent yesterday
                    }

                    long totalWindowMillis = (long) (prayerTimeInSeconds - prevSecs) * 1000L;
                    return new NextPrayerInfo(prayerNames[i], formattedTime, displayCity(s.selectedLocation), millisUntil, totalWindowMillis);
                }
            }

            // Tomorrow Fajr
            int tomorrowIndex = (todayIndex + 1) % cityData.length();
            JSONObject tomorrowPrayers = cityData.getJSONObject(tomorrowIndex);
            String fajrTime = tomorrowPrayers.optString("fajr", "05:30");
            String formattedTime = formatTime(fajrTime, s.timeFormat24h, s.arabicNumerals);

            int fajrSecs = parseTimeToSeconds(fajrTime);
            int secondsLeftToday = (24 * 3600) - currentTimeInSeconds;
            long millisUntil = (secondsLeftToday + fajrSecs) * 1000L;
            // previous is today's isha (or maghrib if missing)
            String ishaToday = todayPrayers.optString("isha", todayPrayers.optString("maghrib", "18:00"));
            int ishaSecs = parseTimeToSeconds(ishaToday);
            // window from today's isha to tomorrow fajr crosses midnight
            long totalWindowMillis = (long) ((24*3600 - ishaSecs) + fajrSecs) * 1000L;
            return new NextPrayerInfo("\u0627\u0644\u0635\u0628\u062d (\u063a\u062f\u0627\u064b)", formattedTime, displayCity(s.selectedLocation), millisUntil, totalWindowMillis);

        } catch (Exception e) {
            e.printStackTrace();
            return new NextPrayerInfo("\u0627\u0644\u0641\u062c\u0631", "05:30", "Beirut", 0L);
        }
    }

    private static String displayCity(String key) {
        if (key == null) return "";
        switch (key.toLowerCase(Locale.ROOT)) {
            case "beirut": return "بيروت";
            case "tyre": return "صور";
            case "saida": return "صيدا";
            case "tripoli": return "طرابلس";
            case "baalbek": return "بعلبك";
            case "hermel": return "الهرمل";
            case "nabatieh-bintjbeil": return "النبطية - بنت جبيل";
            default:
                if (key.length() > 1) return key.substring(0,1).toUpperCase(Locale.getDefault()) + key.substring(1);
                return key;
        }
    }

    private static WidgetSettings loadSettings(Context context) {
        WidgetSettings s = new WidgetSettings();
        try {
            // 1) Read from dedicated app prefs (synced by UpdateModule.syncSettingsForWidget)
            SharedPreferences p = context.getSharedPreferences(APP_PREFS, Context.MODE_PRIVATE);
            String loc = p.getString(SELECTED_LOCATION_PREF, null);
            String tf = p.getString(TIME_FORMAT_PREF, null); // "12h" | "24h"
            boolean useArNumsPref = p.getBoolean(ARABIC_NUMERALS_PREF, false);
            boolean darkModePref = p.getBoolean(DARK_MODE_PREF, false);

            if (loc != null) s.selectedLocation = loc;
            if (tf != null) s.timeFormat24h = "24h".equalsIgnoreCase(tf);
            s.arabicNumerals = useArNumsPref;
            s.darkMode = darkModePref;

            // 2) Fallback to AsyncStorage 'settings'
            if (s.selectedLocation == null || tf == null) {
                SharedPreferences rn = context.getSharedPreferences(REACT_NATIVE_PREFS, Context.MODE_PRIVATE);
                String settingsJson = rn.getString(SETTINGS_KEY, null);
                if (settingsJson != null) {
                    try {
                        if (settingsJson.startsWith("\"") && settingsJson.endsWith("\"")) {
                            settingsJson = settingsJson.substring(1, settingsJson.length() - 1);
                        }
                        JSONObject obj = new JSONObject(settingsJson);
                        if (obj.has("selectedLocation")) s.selectedLocation = obj.optString("selectedLocation", s.selectedLocation);
                        if (obj.has("timeFormat")) s.timeFormat24h = "24h".equalsIgnoreCase(obj.optString("timeFormat", "12h"));
                        if (obj.has("useArabicNumerals")) s.arabicNumerals = obj.optBoolean("useArabicNumerals", s.arabicNumerals);
                        if (obj.has("isDarkMode")) s.darkMode = obj.optBoolean("isDarkMode", s.darkMode);
                    } catch (Exception ignored) {}
                }
            }
        } catch (Exception ignored) {}

        if (s.selectedLocation == null) s.selectedLocation = "beirut";
        return s;
    }

    // Public helper to allow other widget providers to reuse theme choice
    public static boolean isDarkModeEnabled(Context context) {
        try {
            return loadSettings(context).darkMode;
        } catch (Exception e) {
            return false;
        }
    }

    private static String loadPrayerTimes(Context context) {
        // Try updated file written by worker/module, then default file, then asset
        // 1) updated_prayer_times.json
        try {
            File localUpdated = new File(context.getFilesDir(), "updated_prayer_times.json");
            if (localUpdated.exists()) {
                FileInputStream fis = new FileInputStream(localUpdated);
                byte[] bytes = new byte[(int) localUpdated.length()];
                int read = fis.read(bytes);
                fis.close();
                if (read > 0) return new String(bytes, StandardCharsets.UTF_8);
            }
        } catch (Exception ignored) {}

        // 2) prayer_times.json (worker version)
        try {
            File local = new File(context.getFilesDir(), "prayer_times.json");
            if (local.exists()) {
                FileInputStream fis = new FileInputStream(local);
                byte[] bytes = new byte[(int) local.length()];
                int read = fis.read(bytes);
                fis.close();
                if (read > 0) return new String(bytes, StandardCharsets.UTF_8);
            }
        } catch (Exception ignored) {}

        // 3) Asset fallback
        try {
            InputStream is = context.getAssets().open("prayer_times.json");
            int size = is.available();
            byte[] buffer = new byte[size];
            int read = is.read(buffer);
            is.close();
            if (read > 0) return new String(buffer, StandardCharsets.UTF_8);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    private static int getTodayIndex(JSONArray cityData) {
        // The previous implementation used day-of-year % length which drifts when the JSON
        // file only contains a subset (e.g. one month). We instead parse the explicit date
        // field (format like "14/9/2025" or with zero-padded month) to find an exact match.
        try {
            Calendar now = Calendar.getInstance();
            int y = now.get(Calendar.YEAR);
            int m = now.get(Calendar.MONTH) + 1; // Calendar.MONTH is 0-based
            int d = now.get(Calendar.DAY_OF_MONTH);

            for (int i = 0; i < cityData.length(); i++) {
                JSONObject obj = cityData.optJSONObject(i);
                if (obj == null) continue;
                String dateStr = obj.optString("date", null);
                if (dateStr == null || dateStr.trim().isEmpty()) continue;
                // Expected formats: D/M/YYYY or DD/M/YYYY etc. Split on '/'
                String[] parts = dateStr.trim().split("/");
                if (parts.length < 3) continue;
                try {
                    int day = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    int year = Integer.parseInt(parts[2]);
                    if (day == d && month == m && year == y) {
                        return i;
                    }
                } catch (NumberFormatException ignored) { /* skip malformed */ }
            }
            // If not found (e.g., data only for future month), fallback: if current year/month match first entry's month/year, clamp by day-1
            if (cityData.length() > 0) {
                try {
                    JSONObject first = cityData.getJSONObject(0);
                    String dateStr = first.optString("date", "");
                    String[] parts = dateStr.split("/");
                    if (parts.length >= 3) {
                        int firstMonth = Integer.parseInt(parts[1]);
                        int firstYear = Integer.parseInt(parts[2]);
                        if (firstMonth == m && firstYear == y) {
                            int idx = d - 1; // 1-based day to 0-based index
                            if (idx < 0) idx = 0;
                            if (idx >= cityData.length()) idx = cityData.length() - 1;
                            return idx;
                        }
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}
        return 0; // safe fallback
    }

    private static int parseTimeToSeconds(String timeStr) {
        try {
            String[] parts = timeStr.split(":");
            int hours = Integer.parseInt(parts[0]);
            int minutes = Integer.parseInt(parts[1]);
            return hours * 3600 + minutes * 60;
        } catch (Exception e) {
            return 0;
        }
    }

    private static String formatTime(String timeStr, boolean is24h, boolean arabicNumerals) {
        try {
            String[] parts = timeStr.split(":");
            int hours = Integer.parseInt(parts[0]);
            int minutes = Integer.parseInt(parts[1]);

            String formattedTime;
            if (is24h) {
                formattedTime = String.format(Locale.US, "%02d:%02d", hours, minutes);
            } else {
                int displayHours = hours;
                String ampm = "\u0635";

                if (hours == 0) {
                    displayHours = 12;
                } else if (hours == 12) {
                    ampm = "\u0645";
                } else if (hours > 12) {
                    displayHours = hours - 12;
                    ampm = "\u0645";
                }

                formattedTime = String.format(Locale.US, "%d:%02d %s", displayHours, minutes, ampm);
            }

            if (arabicNumerals) {
                return convertToArabicNumerals(formattedTime);
            }

            return formattedTime;
        } catch (Exception e) {
            return timeStr;
        }
    }

    private static String convertToArabicNumerals(String text) {
        String[] english = {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"};
        String[] arabic = {"\u0660", "\u0661", "\u0662", "\u0663", "\u0664", "\u0665", "\u0666", "\u0667", "\u0668", "\u0669"};
        
        for (int i = 0; i < english.length; i++) {
            text = text.replace(english[i], arabic[i]);
        }
        return text;
    }

    private static class WidgetSettings {
        String selectedLocation = "beirut";
        boolean timeFormat24h = false;
        boolean arabicNumerals = false;
    boolean darkMode = false;
    }

    public static class NextPrayerInfo {
        String name;
        String time;
        String city;
        long millisUntil;
        long totalWindowMillis; // new: duration from prev prayer to next

        NextPrayerInfo(String name, String time, String city, long millisUntil) {
            this(name, time, city, millisUntil, 0L);
        }
        NextPrayerInfo(String name, String time, String city, long millisUntil, long totalWindowMillis) {
            this.name = name;
            this.time = time;
            this.city = city;
            this.millisUntil = millisUntil;
            this.totalWindowMillis = totalWindowMillis;
        }
    }

    // Expose next prayer info for other widget variants (small widget)
    public static NextPrayerInfo provideNextPrayerInfo(Context context) {
        return getNextPrayerInfo(context);
    }

    // Made public so small widget provider can reuse a single exact alarm
    public static void scheduleNextUpdate(Context context) {
        try {
            long triggerAt = computeNextPrayerEpochMillis(context);
            if (triggerAt <= 0) return;

            Intent intent = new Intent(context, PrayerWidgetProvider.class);
            intent.setAction(ACTION_UPDATE_NOW);

            PendingIntent pi = PendingIntent.getBroadcast(
                    context,
                    REQ_CODE_UPDATE,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            // Use exact alarm where possible so widget switches exactly at prayer time
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                am.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }

            // Safety fallback: schedule a secondary inexact update 30 minutes later
            long fallbackAt = System.currentTimeMillis() + 30 * 60 * 1000L;
            if (fallbackAt < triggerAt - 2 * 60 * 1000L || fallbackAt > triggerAt + 2 * 60 * 1000L) { // only if sufficiently different
                PendingIntent fallbackPi = PendingIntent.getBroadcast(
                        context,
                        REQ_CODE_UPDATE + 1,
                        new Intent(context, PrayerWidgetProvider.class).setAction(ACTION_UPDATE_NOW),
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                am.set(AlarmManager.RTC_WAKEUP, fallbackAt, fallbackPi);
            }
        } catch (Exception ignored) {}
    }

    public static void cancelScheduledUpdate(Context context) {
        try {
            Intent intent = new Intent(context, PrayerWidgetProvider.class);
            intent.setAction(ACTION_UPDATE_NOW);
            PendingIntent pi = PendingIntent.getBroadcast(
                    context,
                    REQ_CODE_UPDATE,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                am.cancel(pi);
                // cancel fallback
                PendingIntent fallbackPi = PendingIntent.getBroadcast(
                        context,
                        REQ_CODE_UPDATE + 1,
                        new Intent(context, PrayerWidgetProvider.class).setAction(ACTION_UPDATE_NOW),
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                );
                am.cancel(fallbackPi);
            }
        } catch (Exception ignored) {}
    }

    private static long computeNextPrayerEpochMillis(Context context) {
        try {
            WidgetSettings s = loadSettings(context);

            String prayerTimesJson = loadPrayerTimes(context);
            if (prayerTimesJson == null) return 0L;

            JSONObject prayerTimes = new JSONObject(prayerTimesJson);
            JSONArray cityData = prayerTimes.optJSONArray(s.selectedLocation);
            if (cityData == null || cityData.length() == 0) {
                cityData = prayerTimes.optJSONArray("beirut");
            }
            if (cityData == null || cityData.length() == 0) return 0L;

            int todayIndex = getTodayIndex(cityData);
            JSONObject todayPrayers = cityData.getJSONObject(todayIndex);

            String[] order = {"fajr", "shuruq", "dhuhr", "asr", "maghrib", "isha"};

            Calendar now = Calendar.getInstance();
            int nowSec = now.get(Calendar.HOUR_OF_DAY) * 3600 + now.get(Calendar.MINUTE) * 60 + now.get(Calendar.SECOND);

            for (String key : order) {
                String time = todayPrayers.optString(key, null);
                if (time == null) continue;
                int secs = parseTimeToSeconds(time);
                if (secs > nowSec) {
                    Calendar trg = (Calendar) now.clone();
                    trg.set(Calendar.SECOND, secs % 60);
                    trg.set(Calendar.MILLISECOND, 0);
                    trg.set(Calendar.HOUR_OF_DAY, secs / 3600);
                    trg.set(Calendar.MINUTE, (secs % 3600) / 60);
                    return trg.getTimeInMillis();
                }
            }

            // Tomorrow Fajr
            int tomorrowIndex = (todayIndex + 1) % cityData.length();
            JSONObject tomorrowPrayers = cityData.getJSONObject(tomorrowIndex);
            String fajr = tomorrowPrayers.optString("fajr", "05:30");
            int secs = parseTimeToSeconds(fajr);
            Calendar trg = Calendar.getInstance();
            trg.add(Calendar.DAY_OF_YEAR, 1);
            trg.set(Calendar.SECOND, secs % 60);
            trg.set(Calendar.MILLISECOND, 0);
            trg.set(Calendar.HOUR_OF_DAY, secs / 3600);
            trg.set(Calendar.MINUTE, (secs % 3600) / 60);
            return trg.getTimeInMillis();
        } catch (Exception e) {
            return 0L;
        }
    }
}
