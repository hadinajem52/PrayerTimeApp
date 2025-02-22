# Prayer Times & Qibla Compass App

A React Native application that provides accurate Islamic prayer times, daily inspirational quotes, and a Qibla Compass to help users find the direction of the Kaaba. The app supports both English and Arabic, offers dark/light mode, and utilizes Notifee push notifications.

## Features

- **Prayer Times Display:**  
  View prayer times for your selected location along with Hijri dates. Animated transitions allow navigation through different days.

- **Location Selection:**  
  Choose from multiple predefined locations to display prayer times for different regions.

- **Daily Inspirational Quotes:**  
  Receive a daily quote to inspire your day.

- **Qibla Compass:**  
  Use the integrated Qibla Compass to easily determine the direction of the Kaaba for your prayers.

- **Dark/Light Mode & Multilingual Support:**  
  Toggle between dark and light themes, and switch between English and Arabic (with RTL support).

- **Push Notifications:**  
  Schedule notifications for prayer times using Firebase Cloud Messaging.

- **Settings Persistence:**  
  User preferences (language, theme, selected location) are saved locally using AsyncStorage.

## Screenshots
![WhatsApp Image 2025-02-18 at 14 55 19_7341a138](https://github.com/user-attachments/assets/8e4e1cc3-5cf4-427d-9927-b2846b2b6ccf)
![WhatsApp Image 2025-02-18 at 14 55 19_0e32d28f](https://github.com/user-attachments/assets/bf57939b-0a74-4f08-8d5a-54bb579478db)
![WhatsApp Image 2025-02-18 at 14 55 21_3b5dd101](https://github.com/user-attachments/assets/0b03e51d-da05-4804-9061-230693b41af0)
![WhatsApp Image 2025-02-22 at 12 58 24_f0c33b4e](https://github.com/user-attachments/assets/edbcd651-cf31-4ff6-a358-51114c4ff001)

## Technologies Used

- **React Native:** Framework for building native mobile apps using JavaScript.
- **Notifee Notifications:** For push and scheduled notifications.
- **AsyncStorage:** For local data persistence.
- **Compass & Geolocation Libraries:**
  - `react-native-compass-heading`
  - `react-native-geolocation-service`
- **Additional Libraries:**
  - `react-native-vector-icons` for icons
  - `react-native-safe-area-context` for improved UI rendering
  - `moment-hijri` for Hijri date formatting


