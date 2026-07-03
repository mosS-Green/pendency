'use client';

import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/notifications';
import { UserNotification } from '@/lib/types';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW registration:', err));
    }
  }, []);

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setPermission(perm);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        title="Notifications & Summary"
      >
        <Bell className="w-4 h-4" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-xl border border-border bg-card p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                <Bell className="w-4 h-4 text-primary" />
                <span>Action Summary</span>
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Consolidated
              </span>
            </div>

            {/* Permission Banner */}
            {permission !== 'granted' && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Enable Daily Summary Notification</p>
                    <p className="text-muted-foreground text-[11px] leading-tight mt-0.5">
                      Receive a single daily desktop summary of overdue and upcoming CBE target dates.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleEnableNotifications}
                  className="w-full py-1.5 px-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-colors text-center"
                >
                  Enable Desktop Notification
                </button>
              </div>
            )}

            {/* Consolidated Summary List */}
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600 dark:text-emerald-400 opacity-60" />
                <p className="font-medium text-foreground">All items on track</p>
                <p className="text-[11px]">No urgent CBE target dates or overdue items requiring action.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg border border-primary/30 bg-primary/5 space-y-1">
                    <p className="font-semibold text-foreground">{n.title}</p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">{n.body}</p>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center border-t border-border pt-2">
              Note: Aggregated into a single notification while tab is open or backgrounded.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
