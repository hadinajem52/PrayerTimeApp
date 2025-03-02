package com.hnjm123.ShiaPrayerLeb.workers

import android.content.Context
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

class PrayerTimeUpdateWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {

    companion object {
        private const val TAG = "PrayerTimeUpdater"
        private const val JSON_URL = "https://raw.githubusercontent.com/hadinajem52/PrayerTimeApp/main/assets/prayer_times.json"
        private const val LOCAL_FILE_NAME = "prayer_times.json"
        
        // Add this function for immediate updates
        suspend fun forceCheckUpdate(context: Context): Boolean = withContext(Dispatchers.IO) {
            try {
                val localLastUpdated = getLocalLastUpdated(context)
                
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
                    
                    val jsonResponse = response.toString()
                    val jsonObject = JSONObject(jsonResponse)
                    val remoteLastUpdated = jsonObject.optString("last_updated", "")
                    
                    if (remoteLastUpdated.isEmpty()) {
                        Log.e(TAG, "Remote data doesn't contain last_updated field")
                        return@withContext false
                    }
                    
                    if (remoteLastUpdated != localLastUpdated) {
                        Log.d(TAG, "FORCED UPDATE: New prayer time data available")
                        saveJsonLocally(context, jsonResponse)
                        return@withContext true
                    } else {
                        Log.d(TAG, "FORCED UPDATE: No new data available")
                        return@withContext false
                    }
                } 
                return@withContext false
            } catch (e: Exception) {
                Log.e(TAG, "Error in forced update check", e)
                return@withContext false
            }
        }
        
        private fun getLocalLastUpdated(context: Context): String {
            try {
                val file = File(context.filesDir, LOCAL_FILE_NAME)
                if (!file.exists()) return ""
                
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
                Log.d(TAG, "Successfully saved updated prayer times")
            } catch (e: Exception) {
                Log.e(TAG, "Error saving updated data", e)
            }
        }
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
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
                    return@withContext Result.failure()
                }
                
                // If remote data is newer, save it locally
                if (remoteLastUpdated != localLastUpdated) {
                    Log.d(TAG, "New prayer time data available: $remoteLastUpdated vs local: $localLastUpdated")
                    saveJsonLocally(jsonResponse)
                    return@withContext Result.success()
                } else {
                    Log.d(TAG, "Prayer time data is already up to date")
                    return@withContext Result.success()
                }
            } else {
                Log.e(TAG, "HTTP error: $responseCode")
                return@withContext Result.retry()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking for prayer time updates", e)
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
}