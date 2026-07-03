'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { checkAndTriggerNotifications } from '@/lib/notifications';
import { PendencyDashboardView } from '@/lib/types';

export function useRealtimeSync() {
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchAndNotify = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.from('v_pendency_dashboard').select('*');
      if (!error && data) {
        checkAndTriggerNotifications(data as PendencyDashboardView[]);
      }
      setLastSyncedAt(new Date());
    } catch (e) {
      console.error('Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchAndNotify();

    // 15-minute fallback polling interval
    const intervalId = setInterval(() => {
      fetchAndNotify();
    }, 15 * 60 * 1000);

    // Supabase Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pendencies' },
        () => {
          fetchAndNotify();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cbe_history' },
        () => {
          fetchAndNotify();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pendency_comments' },
        () => {
          fetchAndNotify();
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [fetchAndNotify]);

  return {
    lastSyncedAt,
    isSyncing,
    refetchAll: fetchAndNotify,
  };
}
