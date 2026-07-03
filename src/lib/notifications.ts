import { PendencyDashboardView, UserNotification } from './types';

const DEDUP_KEY = 'pendency_tracker_notifications_fired';

export function getStoredFiredKeys(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DEDUP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFiredKey(key: string) {
  if (typeof window === 'undefined') return;
  try {
    const firedMap = getStoredFiredKeys();
    const today = new Date().toISOString().split('T')[0];
    firedMap[key] = today;
    localStorage.setItem(DEDUP_KEY, JSON.stringify(firedMap));
  } catch (e) {
    console.error('Failed to save notification key', e);
  }
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('denied');
  }
  return Notification.requestPermission();
}

export function checkAndTriggerNotifications(pendencies: PendencyDashboardView[]): UserNotification[] {
  const notifications: UserNotification[] = [];
  const firedMap = getStoredFiredKeys();
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  pendencies.forEach((p) => {
    if (p.status !== 'open') return;

    // 1. CBE Due Today or Tomorrow
    if (p.current_cbe_date) {
      const cbeDate = new Date(p.current_cbe_date);
      cbeDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((cbeDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 0 || diffDays === 1) {
        const dedupKey = `cbe_due_${p.id}_${p.current_cbe_date}`;
        const isFiredToday = firedMap[dedupKey] === todayStr;

        const notif: UserNotification = {
          id: dedupKey,
          pendency_id: p.id,
          human_readable_id: p.human_readable_id,
          title: `CBE Due ${diffDays === 0 ? 'Today' : 'Tomorrow'}: #${p.human_readable_id}`,
          body: `[${p.department_name}] ${p.description.slice(0, 80)}...`,
          type: 'cbe_due',
          date: new Date().toISOString(),
          read: false,
        };

        notifications.push(notif);

        if (!isFiredToday && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notif.title, {
            body: notif.body,
            icon: '/favicon.ico',
          });
          saveFiredKey(dedupKey);
        }
      }
    }

    // 2. Stale Pendency (Open with no CBE set for >3 days critical, >7 days non-critical)
    if (!p.current_cbe_date) {
      const threshold = p.criticality === 'critical' ? 3 : 7;
      if (p.days_open >= threshold) {
        const dedupKey = `stale_${p.id}_${todayStr}`;
        const isFiredToday = firedMap[dedupKey] === todayStr;

        const notif: UserNotification = {
          id: dedupKey,
          pendency_id: p.id,
          human_readable_id: p.human_readable_id,
          title: `Awaiting CBE (${p.days_open} days open): #${p.human_readable_id}`,
          body: `[${p.department_name} - ${p.criticality.toUpperCase()}] ${p.description.slice(0, 80)}...`,
          type: 'stale',
          date: new Date().toISOString(),
          read: false,
        };

        notifications.push(notif);

        if (!isFiredToday && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notif.title, {
            body: notif.body,
            icon: '/favicon.ico',
          });
          saveFiredKey(dedupKey);
        }
      }
    }

    // 3. Overdue Pendency (CBE passed by >3 days critical, >7 days non-critical)
    if (p.is_overdue && p.days_since_cbe_due) {
      const threshold = p.criticality === 'critical' ? 3 : 7;
      if (p.days_since_cbe_due >= threshold) {
        const dedupKey = `overdue_${p.id}_${todayStr}`;
        const isFiredToday = firedMap[dedupKey] === todayStr;

        const notif: UserNotification = {
          id: dedupKey,
          pendency_id: p.id,
          human_readable_id: p.human_readable_id,
          title: `Overdue by ${p.days_since_cbe_due} days: #${p.human_readable_id}`,
          body: `[${p.department_name}] ${p.description.slice(0, 80)}...`,
          type: 'overdue',
          date: new Date().toISOString(),
          read: false,
        };

        notifications.push(notif);

        if (!isFiredToday && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(notif.title, {
            body: notif.body,
            icon: '/favicon.ico',
          });
          saveFiredKey(dedupKey);
        }
      }
    }
  });

  return notifications;
}
