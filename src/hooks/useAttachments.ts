'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PendencyAttachment } from '@/lib/types';

export function useAttachments(pendencyId: string | null) {
  const [attachments, setAttachments] = useState<PendencyAttachment[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  const fetchAttachments = useCallback(async () => {
    if (!pendencyId) {
      setAttachments([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('pendency_attachments')
        .select('*')
        .eq('pendency_id', pendencyId)
        .order('uploaded_at', { ascending: false });

      if (!error && data) {
        setAttachments(data as PendencyAttachment[]);
      }
    } catch (err) {
      console.error('Failed to fetch attachments:', err);
    }
  }, [pendencyId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const uploadAttachment = async (file: File, userName: string) => {
    if (!pendencyId) return false;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${pendencyId}_${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('pendency-attachments')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        setUploading(false);
        return false;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pendency-attachments')
        .getPublicUrl(filePath);

      // Save attachment DB record
      const { data, error: dbError } = await supabase
        .from('pendency_attachments')
        .insert({
          pendency_id: pendencyId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          uploaded_by: userName || 'Unknown',
        })
        .select()
        .single();

      if (!dbError && data) {
        setAttachments((prev) => [data as PendencyAttachment, ...prev]);
        setUploading(false);
        return true;
      }
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setUploading(false);
    }
    return false;
  };

  return { attachments, uploading, uploadAttachment, refetch: fetchAttachments };
}
