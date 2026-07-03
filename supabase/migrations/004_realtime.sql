-- ========================================================
-- Construction Pendency Tracker - Migration 004: Realtime
-- ========================================================

-- Enable Supabase Realtime publication for pendencies, cbe_history, and comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pendencies'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pendencies;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'cbe_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cbe_history;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pendency_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE pendency_comments;
  END IF;
END $$;
