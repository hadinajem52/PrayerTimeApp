# ShiaPrayer Lebanon

A comprehensive React Native application providing accurate Islamic prayer times according to Shia jurisprudence, specifically tailored for Lebanese locations. The app features a Qibla compass, daily inspiration, customizable notifications, and full Arabic language support.

## ✨ Features

- **📅 Prayer Times:** 
  - Accurate prayer times following Shia methodology
  - Beautiful animated transitions between days
  - Complete Hijri calendar integration
  - Multiple calculation methods support

- **📍 Location Services:**
  - Predefined Lebanese locations with accurate coordinates
  - Manual location selection option
  - Location-specific prayer time adjustments

- **🧭 Qibla Finder:**
  - Google-powered AR Qibla direction finder
  - WebView-based implementation with camera integration
  - Real-time direction finding with visual overlay
  - Automatic permissions handling

- **🌙 Customization Options:**
  - Dark/Light theme with automatic switching
  - Full Arabic language support with RTL layout
  - Adjustable notification settings
  - Multiple theme color options

- **🔔 Smart Notifications:**
  - Customizable prayer reminders powered by Notifee
  - Battery-efficient background service

- **✈️ Offline Functionality:**
  - Works without internet connection
  - Locally stored prayer calculations
  - Cached inspiration quotes
  - Minimal battery consumption

## 📱 Screenshots

<div style="display: flex; flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 10px;">
  <img src="screenshots/home-light.png" width="200" alt="Home Screen - Light Mode" />
  <img src="screenshots/home-dark.png" width="200" alt="Home Screen - Dark Mode" />
  <img src="screenshots/qibla.png" width="200" alt="Qibla Compass" />
  <img src="screenshots/settings.png" width="200" alt="Settings Screen" />
</div>

## 🛠️ Technologies

- **Frontend Framework:**
  - React Native (latest stable version)
  - React Navigation 6
  - React Native Reanimated for smooth animations

- **State Management & Storage:**
  - Redux Toolkit / Context API
  - AsyncStorage for preferences
  - MMKV for high-performance storage

- **Prayer Times & Location:**
  - Custom Shia prayer calculation algorithms
  - React Native WebView for Qibla integration

- **UI/UX Components:**
  - React Native Paper
  - React Native Vector Icons
  - React Native Safe Area Context

- **Notifications & Background Services:**
  - Notifee for reliable notifications
  - Background fetch for timely updates

## 📋 Requirements

- Android 6.0+
- Node.js 14+
- React Native CLI or Expo (SDK 45+)

## 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ShiaPrayerLeb.git

# Navigate to project directory
cd ShiaPrayerLeb

# Install dependencies
yarn install
# or
npm install

# Start the app
npx react-native run-android
# or
npx react-native run-ios
```


