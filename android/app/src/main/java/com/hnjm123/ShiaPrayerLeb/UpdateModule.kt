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
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class UpdateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "UpdateModule"
    }
    
    @ReactMethod
    fun forceUpdateCheck(promise: Promise) {
        try {
            // First check if device is online
            val connectivityManager = reactApplicationContext.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val networkCapabilities = connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork)
            val isOnline = networkCapabilities != null && 
                (networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) || 
                 networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR))
            
            // Create a single result map that we'll populate based on conditions
            val result = WritableNativeMap()
            
            if (!isOnline) {
                // Return a specific status code for offline
                result.putString("status", "offline")
                result.putString("message", "Device is offline")
                promise.resolve(result)
                return
            }
            
            // Create a one-time work request
            val updateWork = OneTimeWorkRequestBuilder<PrayerTimeUpdateWorker>()
                .build()
            
            // Enqueue the work with a unique name
            WorkManager.getInstance(reactApplicationContext)
                .enqueueUniqueWork(
                    "manual_prayer_time_update",
                    ExistingWorkPolicy.REPLACE,
                    updateWork
                )
            
            Log.d("PrayerApp", "Manual update check initiated, ID: ${updateWork.id}")
            
            // Since WorkManager runs asynchronously, we can't know immediately if it updated the data
            // For simplicity, we'll return "updated" status - the worker will show notifications if needed
            result.putString("status", "updated")
            result.putString("message", "Prayer times check initiated")
            promise.resolve(result)
            
        } catch (e: Exception) {
            Log.e("PrayerApp", "Error during update check", e)
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

    @ReactMethod
    fun checkForPrayerDataUpdates(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("PrayerAppPrefs", Context.MODE_PRIVATE)
            val hasUpdates = prefs.getBoolean("HAS_UPDATED_PRAYER_DATA", false)
            
            // Simply return the value, don't reset it
            promise.resolve(hasUpdates)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to check for prayer time updates", e)
        }
    }

    @ReactMethod
    fun downloadLatestPrayerTimesFromGitHub(promise: Promise) {
        GlobalScope.launch(Dispatchers.IO) {
            try {
                // Replace with your actual GitHub username and repository
                val url = URL("https://raw.githubusercontent.com/hadinajem52/PrayerTimeApp/refs/heads/main/assets/prayer_times.json")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.connectTimeout = 15000
                connection.readTimeout = 15000
                
                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val inputStream = connection.inputStream
                    val reader = BufferedReader(InputStreamReader(inputStream))
                    val stringBuilder = StringBuilder()
                    var line: String?
                    
                    while (reader.readLine().also { line = it } != null) {
                        stringBuilder.append(line)
                    }
                    
                    inputStream.close()
                    val jsonData = stringBuilder.toString()
                    
                    // Save to file
                    val file = File(reactApplicationContext.filesDir, "updated_prayer_times.json")
                    file.writeText(jsonData)
                    
                    // Set update flag
                    val prefs = reactApplicationContext.getSharedPreferences("PrayerAppPrefs", Context.MODE_PRIVATE)
                    prefs.edit().putBoolean("HAS_UPDATED_PRAYER_DATA", true).apply()
                    
                    promise.resolve(true)
                } else {
                    promise.reject("DOWNLOAD_FAILED", "Failed to download, response code: $responseCode")
                }
            } catch (e: Exception) {
                promise.reject("DOWNLOAD_ERROR", e.message, e)
            }
        }
    }
}