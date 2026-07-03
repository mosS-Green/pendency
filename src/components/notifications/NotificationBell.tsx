'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, AlertTriangle, Clock, Calendar, CheckCircle2 } from 'lucide-react';
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

    // Register service worker if supported
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
        title="Notifications & Reminders"
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
                <span>Action Reminders</span>
              </div>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Client-side
              </span>
            </div>

            {/* Permission Banner */}
            {permission !== 'granted' && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Enable Browser Reminders</p>
                    <p className="text-muted-foreground text-[11px] leading-tight mt-0.5">
                      Get instant desktop popups when CBE dates are due or items become overdue while this app is open.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleEnableNotifications}
                  className="w-full py-1.5 px-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-colors text-center"
                >
                  Enable Desktop Notifications
                </button>
              </div>
            )}

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-600 dark:text-emerald-400 opacity-60" />
                <p className="font-medium text-foreground">No urgent reminders</p>
                <p className="text-[11px]">All CBE dates and open items are currently up to date.</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-lg border border-border bg-background flex gap-2.5 items-start">
                    {n.type === 'cbe_due' && <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                    {n.type === 'overdue' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                    {n.type === 'stale' && <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />}
                    <div>
                      <p className="font-medium text-foreground">{n.title}</p>
                      <p className="text-muted-foreground text-[11px] mt-0.5">{n.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center border-t border-border pt-2">
              Note: Reminders evaluate automatically during app sync while open or backgrounded.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
