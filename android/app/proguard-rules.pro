# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# Keep custom notification sounds. The adhan sounds are looked up by name at
# runtime (notifee channel sound / the settings preview player), so every member
# of R$raw has to survive - naming them individually would go stale every time a
# muezzin is added.
-keep class **.R$raw { *; }

# Keep raw resources
-keep class com.hnjm123.ShiaPrayerLeb.R$raw { *; }

# Add any project specific keep options here:
