package com.hnjm123.ShiaPrayerLeb

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetUpdateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WidgetUpdate"
    }

    @ReactMethod
    fun updateWidget() {
        try {
            val context: Context = reactApplicationContext
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, PrayerWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
            
            if (appWidgetIds.isNotEmpty()) {
                val intent = Intent(context, PrayerWidgetProvider::class.java)
                intent.action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, appWidgetIds)
                context.sendBroadcast(intent)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
