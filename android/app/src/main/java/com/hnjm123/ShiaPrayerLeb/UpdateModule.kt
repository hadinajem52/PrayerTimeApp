package com.hnjm123.ShiaPrayerLeb

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.hnjm123.ShiaPrayerLeb.workers.PrayerTimeUpdateWorker
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class UpdateModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String {
        return "UpdateModule"
    }

    @ReactMethod
    fun forceUpdateCheck(promise: Promise) {
        Log.d("UpdateModule", "forceUpdateCheck called from JavaScript")
        
        // Use the Main dispatcher for React Native bridge calls
        CoroutineScope(Dispatchers.Main).launch {
            try {
                val result: Boolean = PrayerTimeUpdateWorker.forceCheckUpdate(reactApplicationContext)
                Log.d("UpdateModule", "Update check result: $result")
                promise.resolve(result)
            } catch (e: Exception) {
                Log.e("UpdateModule", "Error checking for updates", e)
                promise.reject("UPDATE_ERROR", e.message, e)
            }
        }
    }
}