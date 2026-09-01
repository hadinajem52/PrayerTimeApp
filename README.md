# مواقيت الصلاة للشيعة (ShiaPrayer Lebanon)

A comprehensive React Native/Expo application providing accurate Islamic prayer times according to Shia jurisprudence, specifically tailored for Lebanese locations. The app features a Qibla compass, daily inspiration, customizable notifications, and full Arabic language support.

[![Expo SDK](https://img.shields.io/badge/Expo%20SDK-52.0.47-black)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.76.9-blue)](https://reactnative.dev/)
[![Version](https://img.shields.io/badge/Version-1.0.30-green)](https://github.com/hhhhjjj/ShiaPrayerLeb)

## ✨ Features

- **📅 Prayer Times:**
  - Accurate prayer times following Shia methodology for 7 Lebanese locations
  - Beautiful animated transitions between days
  - Complete Hijri calendar integration with `moment-hijri`
  - Automated monthly updates via GitHub Actions

- **📍 Location Services:**
  - Predefined locations: Beirut, Tyre, Saida, Baalbek, Hermel, Tripoli, Nabatieh-Bintjbeil
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
  - Precise timing with device alarms

- **📱 Additional Features:**
  - Daily Islamic quotes and inspiration
  - App rating and feedback system
  - Update checking and in-app updates
  - Responsive design for different screen sizes

- **✈️ Offline Functionality:**
  - Works without internet connection
  - Locally stored prayer calculations
  - Cached inspiration quotes
  - Minimal battery consumption

## 🛠️ Technologies

- **Framework:** Expo SDK 52.0.47 with React Native 0.76.9
- **Navigation:** React Navigation 7.x
- **State Management:** React Context API + AsyncStorage
- **UI Components:** React Native Vector Icons, Linear Gradient
- **Notifications:** Notifee for reliable cross-platform notifications
- **Location & Maps:** React Native WebView for Qibla integration
- **Build System:** EAS Build (Expo Application Services)
- **Data Processing:** Python script with pdfplumber for prayer times extraction

## 📋 Requirements

- **Android:** 6.0+ (API 23+)
- **iOS:** 12.0+
- **Node.js:** 18+
- **Expo CLI:** Latest version
- **Development:** Android Studio (for Android builds)

## 🚀 Installation & Development

### Prerequisites
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Install EAS CLI for builds
npm install -g eas-cli
```

### Local Development
```bash
# Clone the repository
git clone https://github.com/hhhhjjj/ShiaPrayerLeb.git
cd ShiaPrayerLeb

# Install dependencies
npm install

# Start the development server
npm start

# Run on Android device/emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run on web
npm run web
```

### Building for Production

#### Using EAS Build
```bash
# Login to Expo
eas login

# Configure build profile
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS (requires Apple Developer account)
eas build --platform ios
```

#### Local Builds
```bash
# For Android APK
npx expo run:android --variant release

# For iOS (macOS only)
npx expo run:ios --configuration Release
```

## 🔄 Automated Data Updates

The app features automated monthly prayer times updates through GitHub Actions:

- **Schedule:** Runs at 00:30 AM Beirut time on the 1st of every month
- **Source:** Downloads PDFs from Almanar.com.lb
- **Processing:** Python script extracts prayer times using pdfplumber
- **Locations:** Updates data for all 7 Lebanese locations
- **Deployment:** Automatically commits and pushes updated JSON data

### Manual Update Trigger
You can manually trigger the update workflow from GitHub Actions tab.

## 📁 Project Structure

```
ShiaPrayerLeb/
├── android/                 # Android-specific configuration
├── assets/                  # Static assets (icons, images)
├── components/              # Reusable React components
├── context/                 # React Context providers
├── data/                    # Static data (quotes, translations)
├── hooks/                   # Custom React hooks
├── services/                # Background services and utilities
├── utils/                   # Helper functions and utilities
├── .github/workflows/       # GitHub Actions workflows
├── App.js                   # Main app component
├── app.json                 # Expo configuration
├── package.json             # Dependencies and scripts
└── extract_prayer_times.py  # Prayer times data extraction script
```

## 🔒 Security & Privacy

- **No User Data Collection:** The app doesn't collect or store personal user data
- **Location Permissions:** Only used for Qibla direction finding
- **Camera Access:** Required for AR Qibla finder feature
- **Notification Permissions:** Optional, for prayer reminders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

---

**Note:** This app is designed specifically for Shia Muslim communities in Lebanon and follows traditional Shia prayer time calculations.


