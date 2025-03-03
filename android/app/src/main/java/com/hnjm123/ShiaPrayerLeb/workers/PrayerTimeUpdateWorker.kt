package com.hnjm123.ShiaPrayerLeb.workers

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.File
import java.io.FileOutputStream
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.Calendar

class PrayerTimeUpdateWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "PrayerTimeUpdater"
        private const val JSON_URL = "https://raw.githubusercontent.com/hadinajem52/PrayerTimeApp/main/assets/prayer_times.json"
        private const val LOCAL_FILE_NAME = "prayer_times.json"
        private const val CHANNEL_ID = "prayer-channel"
        private const val NOTIFICATION_ID = 1001

        suspend fun forceCheckUpdate(context: Context): Boolean = withContext(Dispatchers.IO) {
            try {
                Log.d(TAG, "Force checking for prayer times update...")
                
                // Get local last_updated value
                val localLastUpdated = getLocalLastUpdated(context)
                Log.d(TAG, "Local last_updated: $localLastUpdated")
                
                // Connect to the URL and get the remote data
                val connection = URL(JSON_URL).openConnection() as HttpURLConnection
                connection.connectTimeout = 15000
                connection.readTimeout = 15000
                
                val responseCode = connection.responseCode
                if (responseCode == HttpURLConnection.HTTP_OK) {
                    val reader = BufferedReader(InputStreamReader(connection.inputStream))
                    val response = StringBuilder()
                    var line: String?
                    while (reader.readLine().also { line = it } != null) {
                        response.append(line)
                    }
                    reader.close()
                    
                    // Parse the JSON
                    val jsonResponse = response.toString()
                    val jsonObject = JSONObject(jsonResponse)
                    
                    // Check if the data is actually updated
                    val remoteLastUpdated = jsonObject.optString("last_updated", "")
                    
                    if (remoteLastUpdated.isEmpty()) {
                        Log.e(TAG, "Remote data doesn't contain last_updated field")
                        return@withContext false
                    }
                    
                    Log.d(TAG, "Remote last_updated: $remoteLastUpdated")
                    
                    // If remote data is newer, save it locally
                    if (remoteLastUpdated != localLastUpdated) {
                        Log.d(TAG, "New prayer time data available - updating local data")
                        saveJsonLocally(context, jsonResponse)
                        return@withContext true
                    } else {
                        Log.d(TAG, "Prayer time data is already up to date")
                        return@withContext false
                    }
                } else {
                    Log.e(TAG, "HTTP error: $responseCode")
                    return@withContext false
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error in forced update check", e)
                return@withContext false
            }
        }

        private fun getLocalLastUpdated(context: Context): String {
            try {
                val file = File(context.filesDir, LOCAL_FILE_NAME)
                if (!file.exists()) {
                    Log.d(TAG, "Local JSON file doesn't exist")
                    return ""
                }
                
                val jsonContent = file.readText()
                val jsonObject = JSONObject(jsonContent)
                return jsonObject.optString("last_updated", "")
            } catch (e: Exception) {
                Log.e(TAG, "Error reading local data", e)
                return ""
            }
        }
        
        private fun saveJsonLocally(context: Context, jsonContent: String) {
            try {
                val file = File(context.filesDir, LOCAL_FILE_NAME)
                FileOutputStream(file).use { output ->
                    output.write(jsonContent.toByteArray(StandardCharsets.UTF_8))
                }
                Log.d(TAG, "Successfully saved updated prayer times to ${file.absolutePath}")
            } catch (e: Exception) {
                Log.e(TAG, "Error saving updated data", e)
            }
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        Log.d("PrayerApp", "PrayerTimeUpdateWorker started at ${Calendar.getInstance().time}")
        
        try {
            // Your existing update code
            val updateResult = performUpdate()
            
            if (updateResult) {
                Log.d("PrayerApp", "Prayer time update completed successfully")
                showUpdateNotification()
                return@withContext Result.success()
            } else {
                Log.w("PrayerApp", "Prayer time update did not find new data")
                return@withContext Result.success() // Still mark as success even if no update needed
            }
        } catch (e: Exception) {
            Log.e("PrayerApp", "Prayer time update failed", e)
            return@withContext Result.retry()
        }
    }
    
    private fun getLocalLastUpdated(): String {
        try {
            val file = File(applicationContext.filesDir, LOCAL_FILE_NAME)
            if (!file.exists()) return ""
            
            val jsonContent = file.readText()
            val jsonObject = JSONObject(jsonContent)
            return jsonObject.optString("last_updated", "")
        } catch (e: Exception) {
            Log.e(TAG, "Error reading local data", e)
            return ""
        }
    }
    
    private fun saveJsonLocally(jsonContent: String) {
        try {
            val file = File(applicationContext.filesDir, LOCAL_FILE_NAME)
            FileOutputStream(file).use { output ->
                output.write(jsonContent.toByteArray(StandardCharsets.UTF_8))
            }
            Log.d(TAG, "Successfully saved updated prayer times")
        } catch (e: Exception) {
            Log.e(TAG, "Error saving updated data", e)
        }
    }

    private suspend fun performUpdate(): Boolean {
        // Get local last_updated value
        val localLastUpdated = getLocalLastUpdated()
        
        // Connect to the URL and get the remote data
        val connection = URL(JSON_URL).openConnection() as HttpURLConnection
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        
        val responseCode = connection.responseCode
        if (responseCode == HttpURLConnection.HTTP_OK) {
            val reader = BufferedReader(InputStreamReader(connection.inputStream))
            val response = StringBuilder()
            var line: String?
            while (reader.readLine().also { line = it } != null) {
                response.append(line)
            }
            reader.close()
            
            // Parse the JSON
            val jsonResponse = response.toString()
            val jsonObject = JSONObject(jsonResponse)
            
            // Check if the data is actually updated
            val remoteLastUpdated = jsonObject.optString("last_updated", "")
            
            if (remoteLastUpdated.isEmpty()) {
                Log.e(TAG, "Remote data doesn't contain last_updated field")
                return false
            }
            
            // If remote data is newer, save it locally
            if (remoteLastUpdated != localLastUpdated) {
                Log.d(TAG, "New prayer time data available: $remoteLastUpdated vs local: $localLastUpdated")
                saveJsonLocally(jsonResponse)
                
                return true
            } else {
                Log.d(TAG, "Prayer time data is already up to date")
                return true
            }
        } else {
            Log.e(TAG, "HTTP error: $responseCode")
            return false
        }
    }

    private fun showUpdateNotification() {
        val context = applicationContext
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        // Create intent to open app when notification is tapped
        val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_IMMUTABLE
        )
        
        // Build the notification
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_sync) // You should use your app's icon
            .setContentTitle("Prayer Times Updated")
            .setContentText("The prayer times data has been updated to the latest version")
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()
        
        // Show the notification
        notificationManager.notify(NOTIFICATION_ID, notification)
        
        Log.d(TAG, "Update notification displayed to user")
    }
}