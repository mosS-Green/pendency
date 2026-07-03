'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PendencyComment } from '@/lib/types';

export function useComments(pendencyId: string | null) {
  const [comments, setComments] = useState<PendencyComment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchComments = useCallback(async () => {
    if (!pendencyId) {
      setComments([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pendency_comments')
        .select('*')
        .eq('pendency_id', pendencyId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setComments(data as PendencyComment[]);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  }, [pendencyId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (author: string, body: string) => {
    if (!pendencyId || !body.trim()) return false;

    const { data, error } = await supabase
      .from('pendency_comments')
      .insert({
        pendency_id: pendencyId,
        author: author || 'Unknown',
        body: body.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setComments((prev) => [...prev, data as PendencyComment]);
      return true;
    }
    return false;
  };

  return { comments, loading, addComment, refetch: fetchComments };
}
