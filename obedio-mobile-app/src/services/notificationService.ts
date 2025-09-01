import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  // Register for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Ask for permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      // Get the token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      this.expoPushToken = token.data;
      console.log('Expo Push Token:', token.data);
      
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  // Get current push token
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // Schedule a local notification
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
  ) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: trigger || null, // null means immediate
      });
      
      console.log('Scheduled notification with ID:', id);
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('Cancelled notification:', notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // Set badge count
  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Clear badge
  async clearBadge() {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Error clearing badge:', error);
    }
  }

  // Add notification received listener
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ) {
    return Notifications.addNotificationReceivedListener(listener);
  }

  // Add notification response listener (when user taps notification)
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Send notification for new request
  async notifyNewRequest(requestId: number, deviceName: string, room: string) {
    await this.scheduleLocalNotification(
      'New Request',
      `${deviceName} in ${room} needs assistance`,
      {
        type: 'new_request',
        requestId,
        deviceName,
        room,
      }
    );
  }

  // Send notification for request assignment
  async notifyRequestAssigned(requestId: number, assignedTo: string) {
    await this.scheduleLocalNotification(
      'Request Assigned',
      `Request has been assigned to ${assignedTo}`,
      {
        type: 'request_assigned',
        requestId,
        assignedTo,
      }
    );
  }

  // Send notification for low battery device
  async notifyLowBattery(deviceName: string, batteryLevel: number) {
    await this.scheduleLocalNotification(
      'Low Battery Alert',
      `${deviceName} battery is at ${batteryLevel}%`,
      {
        type: 'low_battery',
        deviceName,
        batteryLevel,
      }
    );
  }

  // Send notification for system alert
  async notifySystemAlert(title: string, message: string) {
    await this.scheduleLocalNotification(
      title,
      message,
      {
        type: 'system_alert',
      }
    );
  }
}

export const notificationService = new NotificationService();

// Helper function to handle notification permissions on app start
export async function initializeNotifications() {
  try {
    const token = await notificationService.registerForPushNotifications();
    
    if (token) {
      console.log('Push notifications initialized successfully');
      // Here you could send the token to your backend server
      // to associate it with the current user
    }
    
    return token;
  } catch (error) {
    console.error('Failed to initialize notifications:', error);
    return null;
  }
}