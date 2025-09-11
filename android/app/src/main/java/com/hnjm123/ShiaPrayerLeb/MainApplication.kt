package com.hnjm123.ShiaPrayerLeb

import android.app.Application
import android.content.res.Configuration
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.hnjm123.ShiaPrayerLeb.workers.PrayerTimeUpdateWorker
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper
import java.util.concurrent.TimeUnit
import android.util.Log
import androidx.work.Constraints
import androidx.work.NetworkType
import java.util.Calendar

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            // Packages that cannot be autolinked yet can be added manually here
            packages.add(UpdateModulePackage())
            packages.add(WidgetUpdateModulePackage())
            return packages
          }

          override fun getJSMainModuleName(): String = ".expo/.virtual-metro-entry"
          
          override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
          
          override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
          override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }
  )
  
  override val reactHost: ReactHost
    get() = ReactNativeHostWrapper.createReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, OpenSourceMergedSoMapping)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
        load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
    
    // Reference custom notification sound so resource shrinker keeps @raw/prayersound
    // (Used by Notifee channel sound: 'prayersound')
    @Suppress("UNUSED_VARIABLE")
    val keepSound = R.raw.prayersound // Make sure this line stays
    
    // Schedule prayer time updates
    schedulePrayerTimeUpdates()
  }

  private fun schedulePrayerTimeUpdates() {
    Log.d("PrayerApp", "Starting to schedule prayer time updates")

  // Version the scheduling spec so we only reschedule when logic/time changes
  val CURRENT_SCHEDULE_VERSION = 2 // increment when changing target time or constraints
  val prefs = getSharedPreferences("PrayerAppPrefs", MODE_PRIVATE)
  val storedVersion = prefs.getInt("PRAYER_UPDATE_SCHEDULE_VERSION", 0)
  if (storedVersion == CURRENT_SCHEDULE_VERSION) {
    Log.d("PrayerApp", "Prayer time update work already scheduled with current version; skipping re-schedule.")
    return
  } else {
    Log.d("PrayerApp", "Scheduling update worker (schedule version change: stored=$storedVersion -> new=$CURRENT_SCHEDULE_VERSION)")
  }
    
  // Calculate delay until next 12:30 AM
    val calendar = Calendar.getInstance()
    val now = calendar.timeInMillis
    
    // Log current time
    val currentTime = Calendar.getInstance()
    Log.d("PrayerApp", "Current time: ${currentTime.time}")
    
  // Set target time to 12:30 AM
    calendar.set(Calendar.HOUR_OF_DAY, 0)
  calendar.set(Calendar.MINUTE, 30)
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    
  // If current time is after today's 12:30 AM, schedule for tomorrow
    if (now > calendar.timeInMillis) {
        calendar.add(Calendar.DAY_OF_YEAR, 1)
    Log.d("PrayerApp", "Scheduling for tomorrow at 12:30 AM: ${calendar.time}")
    } else {
    Log.d("PrayerApp", "Scheduling for today at 12:30 AM: ${calendar.time}")
    }
    
    // Calculate initial delay in milliseconds
    val initialDelay = calendar.timeInMillis - now
    val initialDelayHours = initialDelay / (1000 * 60 * 60)
    val initialDelayMinutes = (initialDelay / (1000 * 60)) % 60
    Log.d("PrayerApp", "Initial delay: $initialDelay ms (approximately $initialDelayHours hours and $initialDelayMinutes minutes)")
    
    // Set network and charging constraints
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()
    Log.d("PrayerApp", "Network constraint set: requires network connection")
    
    try {
        val updateWorkRequest = PeriodicWorkRequestBuilder<PrayerTimeUpdateWorker>(
            24, TimeUnit.HOURS  // Run once every 24 hours
        )
        .setInitialDelay(initialDelay, TimeUnit.MILLISECONDS)
        .setConstraints(constraints)
        .build()
        
    val workManager = WorkManager.getInstance(this)
    workManager.enqueueUniquePeriodicWork(
      "prayer_time_update",
      ExistingPeriodicWorkPolicy.REPLACE, // Replace only because schedule version changed (we gated above)
      updateWorkRequest
    )
    Log.d("PrayerApp", "Prayer time update work scheduled (12:30 AM daily) with ID: ${updateWorkRequest.id}")

    // Persist schedule version so we don't reschedule every launch
    prefs.edit().putInt("PRAYER_UPDATE_SCHEDULE_VERSION", CURRENT_SCHEDULE_VERSION).apply()
    } catch (e: Exception) {
        Log.e("PrayerApp", "Failed to schedule prayer time updates", e)
    }
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
