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

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHostWrapper(
        this,
        object : DefaultReactNativeHost(this) {
          override fun getPackages(): List<ReactPackage> {
            val packages = PackageList(this).packages
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(new MyReactNativePackage());
            // Add your package
            packages.add(UpdateModulePackage())
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
      // If you opted-in for the New Architecture, we load the native entry point for this app.
      load()
    }
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
    
    // Schedule prayer time updates
    schedulePrayerTimeUpdates()
  }

  private fun schedulePrayerTimeUpdates() {
    val updateWorkRequest = PeriodicWorkRequestBuilder<PrayerTimeUpdateWorker>(
      24, TimeUnit.HOURS  // Run once a day
    )
    .setInitialDelay(1, TimeUnit.HOURS)  // Wait a bit after app starts
    .build()
      
    WorkManager.getInstance(this).enqueueUniquePeriodicWork(
      "prayer_time_update",
      ExistingPeriodicWorkPolicy.KEEP,  // Keep existing if already scheduled
      updateWorkRequest
    )
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}
