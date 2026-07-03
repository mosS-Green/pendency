import { PendencyDashboardView, UserNotification } from './types';

const DEDUP_KEY = 'pendency_tracker_notifications_summary_fired';

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
  const openItems = pendencies.filter((p) => p.status === 'open');
  if (openItems.length === 0) return [];

  const overdueCount = openItems.filter((p) => p.is_overdue).length;
  const awaitingCBECount = openItems.filter((p) => !p.current_cbe_date).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Check CBE due today or tomorrow
  let cbeDueCount = 0;
  openItems.forEach((p) => {
    if (p.current_cbe_date) {
      const cbeDate = new Date(p.current_cbe_date);
      cbeDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((cbeDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 0 || diffDays === 1) {
        cbeDueCount++;
      }
    }
  });

  // Only generate a summary notification if there are items needing attention
  if (overdueCount === 0 && cbeDueCount === 0 && awaitingCBECount === 0) {
    return [];
  }

  const dedupKey = `summary_${todayStr}_${overdueCount}_${cbeDueCount}`;
  const firedMap = getStoredFiredKeys();
  const isFiredToday = firedMap[dedupKey] === todayStr;

  // Build aggregated body text
  const parts: string[] = [];
  if (overdueCount > 0) parts.push(`${overdueCount} overdue`);
  if (cbeDueCount > 0) parts.push(`${cbeDueCount} CBE due today/tomorrow`);
  if (awaitingCBECount > 0) parts.push(`${awaitingCBECount} awaiting target date`);

  const title = `Woods Pendency Summary: ${parts.join(', ')}`;
  const body = `Total ${openItems.length} open action items. Click to open tracker.`;

  const summaryNotif: UserNotification = {
    id: dedupKey,
    pendency_id: 'summary',
    human_readable_id: 0,
    title,
    body,
    type: overdueCount > 0 ? 'overdue' : 'cbe_due',
    date: new Date().toISOString(),
    read: false,
  };

  // Fire ONE SINGLE browser notification for the day
  if (!isFiredToday && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(summaryNotif.title, {
      body: summaryNotif.body,
      icon: '/icon.svg',
    });
    saveFiredKey(dedupKey);
  }

  return [summaryNotif];
}
