# Prayer Times & Qibla Compass App

A React Native application that provides accurate Islamic prayer times, daily inspirational quotes, and a Qibla Compass to help users find the direction of the Kaaba. The app supports both English and Arabic, offers dark/light mode, and utilizes Firebase push notifications.

## Features

- **Prayer Times Display:**  
  View prayer times for your selected location along with Hijri dates. Animated transitions allow navigation through different days.

- **Location Selection:**  
  Choose from multiple predefined locations to display prayer times for different regions.

- **Daily Inspirational Quotes:**  
  Receive a daily motivational quote to inspire your day.

- **Qibla Compass:**  
  Use the integrated Qibla Compass to easily determine the direction of the Kaaba for your prayers.

- **Dark/Light Mode & Multilingual Support:**  
  Toggle between dark and light themes, and switch between English and Arabic (with RTL support).

- **Push Notifications:**  
  Schedule notifications for prayer times using Firebase Cloud Messaging.

- **Settings Persistence:**  
  User preferences (language, theme, selected location) are saved locally using AsyncStorage.

## Screenshots

*(Add screenshots of your app here)*

## Technologies Used

- **React Native:** Framework for building native mobile apps using JavaScript.
- **Firebase Cloud Messaging:** For push notifications.
- **AsyncStorage:** For local data persistence.
- **Compass & Geolocation Libraries:**
  - `react-native-compass-heading`
  - `react-native-geolocation-service`
- **Additional Libraries:**
  - `react-native-vector-icons` for icons
  - `react-native-safe-area-context` for improved UI rendering
  - `moment-hijri` for Hijri date formatting


