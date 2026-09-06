import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * 1. Request notification permissions from user & setup Android notification channel
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    let granted =
      settings.granted ||
      settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      granted =
        requested.granted ||
        requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E3A8A',
        sound: 'default',
      });
    }

    return granted;
  } catch (error) {
    console.warn('Failed to request notification permissions:', error);
    return false;
  }
}

// Export alias for requestPermissionsAsync
export const requestPermissionsAsync = requestNotificationPermissions;

/**
 * 2. Schedule daily recurring notification for a specific medication
 * @param timeString format "HH:mm"
 */
export async function scheduleMedicationReminder(
  medicineId: string,
  name: string,
  dosage: string,
  timeString: string
): Promise<string | null> {
  try {
    // Cancel existing reminder for this medicine before setting a new one
    await cancelMedicationReminders(medicineId);

    const parts = timeString.split(':');
    const hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);

    if (isNaN(hour) || isNaN(minute)) {
      console.warn(`Invalid time format for notification: ${timeString}`);
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Pill Reminder: ${name}`,
        body: `It's time for ${name} (${dosage}). Open CareBridge to log your dose.`,
        sound: true,
        data: {
          medicineId,
          name,
          dosage,
          timeString,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'medication-reminders',
      },
    });

    return identifier;
  } catch (error) {
    console.warn(`Failed to schedule reminder for ${name}:`, error);
    return null;
  }
}

/**
 * 3. Cancel all scheduled notifications for a specific medicine
 */
export async function cancelMedicationReminders(medicineId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (item.content.data?.medicineId === medicineId) {
        await Notifications.cancelScheduledNotificationAsync(item.identifier);
      }
    }
  } catch (error) {
    console.warn(`Failed to cancel notification for medicine ${medicineId}:`, error);
  }
}

export const NotificationService = {
  requestNotificationPermissions,
  requestPermissionsAsync,
  scheduleMedicationReminder,
  cancelMedicationReminders,
};
