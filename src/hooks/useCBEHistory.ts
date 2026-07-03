'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CBEHistoryItem } from '@/lib/types';

export function useCBEHistory(pendencyId: string | null) {
  const [history, setHistory] = useState<CBEHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    if (!pendencyId) {
      setHistory([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cbe_history')
        .select('*')
        .eq('pendency_id', pendencyId)
        .order('changed_at', { ascending: false });

      if (!error && data) {
        setHistory(data as CBEHistoryItem[]);
      }
    } catch (err) {
      console.error('Failed to fetch CBE history:', err);
    } finally {
      setLoading(false);
    }
  }, [pendencyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, refetch: fetchHistory };
}
