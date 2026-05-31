export interface NotificationSettings {
  enabled: boolean;
  daysBefore: number;
  hourOfDay: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  daysBefore: 3,
  hourOfDay: 9,
};
