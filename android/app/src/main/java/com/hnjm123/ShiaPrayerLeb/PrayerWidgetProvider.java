package com.hnjm123.ShiaPrayerLeb;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;
import org.json.JSONArray;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Calendar;

public class PrayerWidgetProvider extends AppWidgetProvider {

    private static final String REACT_NATIVE_PREFS = "RCTAsyncLocalStorage_V1";
    private static final String SELECTED_CITY_KEY = "selectedCity";
    private static final String TIME_FORMAT_KEY = "timeFormat24h";
    private static final String ARABIC_NUMERALS_KEY = "arabicNumerals";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.prayer_widget);
        
        try {
            NextPrayerInfo nextPrayer = getNextPrayerInfo(context);
            
            if (nextPrayer != null) {
                views.setTextViewText(R.id.prayer_name, nextPrayer.name);
                views.setTextViewText(R.id.prayer_time, nextPrayer.time);
                views.setTextViewText(R.id.city_name, nextPrayer.city);
            } else {
                views.setTextViewText(R.id.prayer_name, "جاري التحميل...");
                views.setTextViewText(R.id.prayer_time, "--:--");
                views.setTextViewText(R.id.city_name, "");
            }
        } catch (Exception e) {
            views.setTextViewText(R.id.prayer_name, "خطأ");
            views.setTextViewText(R.id.prayer_time, "--:--");
            views.setTextViewText(R.id.city_name, "");
        }

        // Create an intent to open the main app when widget is tapped
        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, 
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.prayer_widget_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static NextPrayerInfo getNextPrayerInfo(Context context) {
        try {
            // Try to get preferences from React Native AsyncStorage
            SharedPreferences prefs = context.getSharedPreferences(REACT_NATIVE_PREFS, Context.MODE_PRIVATE);
            String selectedCity = getStringFromPrefs(prefs, SELECTED_CITY_KEY, "بيروت");
            boolean timeFormat24h = getBooleanFromPrefs(prefs, TIME_FORMAT_KEY, false);
            boolean arabicNumerals = getBooleanFromPrefs(prefs, ARABIC_NUMERALS_KEY, false);

            // Load prayer times from assets
            String prayerTimesJson = loadPrayerTimesFromAssets(context);
            if (prayerTimesJson == null) {
                return new NextPrayerInfo("الفجر", "05:30", selectedCity);
            }

            JSONObject prayerTimes = new JSONObject(prayerTimesJson);
            JSONArray cityData = prayerTimes.optJSONArray(selectedCity);
            
            if (cityData == null || cityData.length() == 0) {
                // Fallback to default city if selected city not found
                cityData = prayerTimes.optJSONArray("بيروت");
                selectedCity = "بيروت";
            }

            if (cityData == null) {
                return new NextPrayerInfo("الفجر", "05:30", selectedCity);
            }

            // Get today's index based on current date
            int todayIndex = getTodayIndex(cityData);
            JSONObject todayPrayers = cityData.getJSONObject(todayIndex);

            // Find next prayer
            String[] prayerOrder = {"fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"};
            String[] prayerNames = {"الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"};
            
            Calendar now = Calendar.getInstance();
            int currentHour = now.get(Calendar.HOUR_OF_DAY);
            int currentMinute = now.get(Calendar.MINUTE);
            int currentTimeInMinutes = currentHour * 60 + currentMinute;

            for (int i = 0; i < prayerOrder.length; i++) {
                String prayerTimeStr = todayPrayers.optString(prayerOrder[i], "00:00");
                int prayerTimeInMinutes = parseTimeToMinutes(prayerTimeStr);
                
                if (prayerTimeInMinutes > currentTimeInMinutes) {
                    String formattedTime = formatTime(prayerTimeStr, timeFormat24h, arabicNumerals);
                    return new NextPrayerInfo(prayerNames[i], formattedTime, selectedCity);
                }
            }

            // If no more prayers today, get tomorrow's Fajr
            int tomorrowIndex = (todayIndex + 1) % cityData.length();
            JSONObject tomorrowPrayers = cityData.getJSONObject(tomorrowIndex);
            String fajrTime = tomorrowPrayers.optString("fajr", "05:30");
            String formattedTime = formatTime(fajrTime, timeFormat24h, arabicNumerals);
            return new NextPrayerInfo("الفجر (غداً)", formattedTime, selectedCity);

        } catch (Exception e) {
            e.printStackTrace();
            return new NextPrayerInfo("الفجر", "05:30", "بيروت");
        }
    }

    private static String getStringFromPrefs(SharedPreferences prefs, String key, String defaultValue) {
        try {
            String value = prefs.getString(key, null);
            if (value != null && value.startsWith("\"") && value.endsWith("\"")) {
                // Remove quotes if present (React Native AsyncStorage format)
                value = value.substring(1, value.length() - 1);
            }
            return value != null ? value : defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private static boolean getBooleanFromPrefs(SharedPreferences prefs, String key, boolean defaultValue) {
        try {
            String value = prefs.getString(key, null);
            if (value != null) {
                return Boolean.parseBoolean(value);
            }
            return defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }

    private static String loadPrayerTimesFromAssets(Context context) {
        try {
            java.io.InputStream is = context.getAssets().open("prayer_times.json");
            int size = is.available();
            byte[] buffer = new byte[size];
            is.read(buffer);
            is.close();
            return new String(buffer, "UTF-8");
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private static int getTodayIndex(JSONArray cityData) {
        try {
            // Simple implementation - this should be improved to match the app's logic
            Calendar cal = Calendar.getInstance();
            int dayOfYear = cal.get(Calendar.DAY_OF_YEAR);
            return dayOfYear % cityData.length();
        } catch (Exception e) {
            return 0;
        }
    }

    private static int parseTimeToMinutes(String timeStr) {
        try {
            String[] parts = timeStr.split(":");
            int hours = Integer.parseInt(parts[0]);
            int minutes = Integer.parseInt(parts[1]);
            return hours * 60 + minutes;
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
                String ampm = "ص";
                
                if (hours == 0) {
                    displayHours = 12;
                } else if (hours == 12) {
                    ampm = "م";
                } else if (hours > 12) {
                    displayHours = hours - 12;
                    ampm = "م";
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
        String[] arabic = {"٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"};
        
        for (int i = 0; i < english.length; i++) {
            text = text.replace(english[i], arabic[i]);
        }
        return text;
    }

    private static class NextPrayerInfo {
        String name;
        String time;
        String city;

        NextPrayerInfo(String name, String time, String city) {
            this.name = name;
            this.time = time;
            this.city = city;
        }
    }
}
