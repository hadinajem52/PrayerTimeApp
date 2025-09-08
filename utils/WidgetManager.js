import { NativeModules } from 'react-native';

const { WidgetUpdate } = NativeModules;

/**
 * Widget Manager - Handle home screen widget operations
 */
class WidgetManager {
  /**
   * Update the home screen widget with latest prayer information
   */
  static updateWidget() {
    if (WidgetUpdate && WidgetUpdate.updateWidget) {
      try {
        WidgetUpdate.updateWidget();
        console.log('Widget update requested');
      } catch (error) {
        console.error('Failed to update widget:', error);
      }
    } else {
      console.log('Widget update module not available (likely iOS or development)');
    }
  }

  /**
   * Check if widget functionality is available
   */
  static isAvailable() {
    return WidgetUpdate && WidgetUpdate.updateWidget;
  }
}

export default WidgetManager;
