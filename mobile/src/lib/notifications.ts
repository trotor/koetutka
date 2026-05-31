import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  TriggerType,
  TimestampTrigger,
} from '@notifee/react-native';
import type { Event } from '@koetutka/shared';
import type { NotificationSettings } from './notifications.types';

export {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from './notifications.types';

const CHANNEL_ID = 'koetutka-reminders';

export async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Koemuistutukset',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function requestPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED
    || settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
}

export async function cancelAll(): Promise<void> {
  await notifee.cancelTriggerNotifications();
}

function eventStartTimestamp(event: Event): number | null {
  const iso = event.date_sort;
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

export async function rescheduleAll(
  favoriteEvents: Event[],
  settings: NotificationSettings,
): Promise<void> {
  await cancelAll();
  if (!settings.enabled) return;

  await ensureChannel();
  const now = Date.now();
  const offsetMs = settings.daysBefore * 24 * 60 * 60 * 1000;

  for (const event of favoriteEvents) {
    const start = eventStartTimestamp(event);
    if (start === null) continue;

    const reminder = new Date(start - offsetMs);
    reminder.setHours(settings.hourOfDay, 0, 0, 0);
    const fireAt = reminder.getTime();
    if (fireAt <= now) continue;

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: fireAt,
    };

    await notifee.createTriggerNotification(
      {
        id: `koe-${event.id}`,
        title: event.name || event.location,
        body: `${event.date} · ${event.type} ${event.levels} (${event.location})`,
        android: {
          channelId: CHANNEL_ID,
          pressAction: { id: 'default' },
          smallIcon: 'ic_launcher',
        },
        data: { eventId: event.id },
      },
      trigger,
    );
  }
}
