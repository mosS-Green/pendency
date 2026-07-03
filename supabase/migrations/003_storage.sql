-- ========================================================
-- Construction Pendency Tracker - Migration 003: Storage
-- ========================================================

-- Create public storage bucket for pendency attachments (drawings, approval documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pendency-attachments', 'pendency-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Public Storage Access Policies (No Auth / RLS restrictive rules required for this internal tool)
CREATE POLICY "Public Read Access on pendency-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'pendency-attachments');

CREATE POLICY "Public Insert Access on pendency-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pendency-attachments');

CREATE POLICY "Public Delete Access on pendency-attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'pendency-attachments');
