-- ========================================================
-- Quick Fix Script: Update trg_cbe_history Trigger
-- Run this in Supabase SQL Editor if you already ran 001_schema.sql
-- ========================================================

-- 1. Auto-update updated_at timestamp BEFORE UPDATE
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_updated_at ON pendencies;
CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON pendencies
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 2. Track CBE date changes AFTER UPDATE
CREATE OR REPLACE FUNCTION fn_track_cbe_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.current_cbe_date IS DISTINCT FROM NEW.current_cbe_date) THEN
    INSERT INTO cbe_history (pendency_id, previous_cbe_date, new_cbe_date, changed_by, reason)
    VALUES (
      NEW.id,
      OLD.current_cbe_date,
      NEW.current_cbe_date,
      COALESCE(NEW.updated_by, 'Unknown'),
      'CBE Date updated'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cbe_history ON pendencies;
CREATE TRIGGER trg_cbe_history
AFTER UPDATE ON pendencies
FOR EACH ROW EXECUTE FUNCTION fn_track_cbe_change();
