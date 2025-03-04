package com.hnjm123.ShiaPrayerLeb

import android.util.Log
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.hnjm123.ShiaPrayerLeb.workers.PrayerTimeUpdateWorker
import androidx.work.ExistingWorkPolicy
import java.io.File
import java.io.FileOutputStream
import android.content.Context
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.bridge.WritableMap
import com.google.gson.Gson
import org.json.JSONObject

class UpdateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "UpdateModule"
    }
    
    @ReactMethod
    fun forceUpdateCheck(promise: Promise) {
        try {
            // Create a one-time work request for immediate execution
            val updateWork = OneTimeWorkRequestBuilder<PrayerTimeUpdateWorker>()
                .build()
                
            // Enqueue the work request
            WorkManager.getInstance(reactApplicationContext)
                .enqueueUniqueWork(
                    "manual_prayer_time_update",
                    ExistingWorkPolicy.REPLACE,
                    updateWork
                )
                
            Log.d("PrayerApp", "Manual update check initiated")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("PrayerApp", "Error during manual update check", e)
            promise.reject("ERROR", "Failed to check for prayer time updates", e)
        }
    }
    
    @ReactMethod
    fun triggerWorkManagerJob(promise: Promise) {
        try {
            // Create a one-time work request that runs the same worker as the scheduled job
            val updateWork = OneTimeWorkRequestBuilder<PrayerTimeUpdateWorker>()
                .build()
                
            // Enqueue the work with a unique name
            WorkManager.getInstance(reactApplicationContext)
                .enqueueUniqueWork(
                    "manual_prayer_time_update",
                    ExistingWorkPolicy.REPLACE,
                    updateWork
                )
                
            Log.d("PrayerApp", "Manual WorkManager job triggered, ID: ${updateWork.id}")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("PrayerApp", "Failed to trigger WorkManager job", e)
            promise.reject("ERROR", "Failed to trigger WorkManager job", e)
        }
    }

    @ReactMethod
    fun saveUpdatedPrayerTimes(jsonData: String, promise: Promise) {
        try {
            // Save to internal storage
            val file = File(reactApplicationContext.filesDir, "updated_prayer_times.json")
            file.writeText(jsonData)
            
            // Save last updated timestamp to SharedPreferences
            val sharedPrefs = reactApplicationContext.getSharedPreferences("PrayerAppPrefs", Context.MODE_PRIVATE)
            sharedPrefs.edit().putLong("prayer_data_updated_at", System.currentTimeMillis()).apply()
            
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("PrayerApp", "Failed to save prayer times data", e)
            promise.reject("ERROR", "Failed to save prayer times data", e)
        }
    }

    @ReactMethod
    fun getUpdatedPrayerTimes(promise: Promise) {
        try {
            val file = File(reactApplicationContext.filesDir, "updated_prayer_times.json")
            if (file.exists()) {
                val jsonData = file.readText()
                promise.resolve(jsonData)
            } else {
                promise.resolve(null)
            }
        } catch (e: Exception) {
            Log.e("PrayerApp", "Failed to get prayer times data", e)
            promise.reject("ERROR", "Failed to get prayer times data", e)
        }
    }
}