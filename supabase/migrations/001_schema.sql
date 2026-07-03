-- ========================================================
-- Construction Pendency Tracker - Migration 001: Schema
-- ========================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Towers Table
CREATE TABLE IF NOT EXISTS towers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, name)
);

-- 3. Departments Table (Admin editable lookup)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Pendency Types Table (Admin editable lookup)
CREATE TABLE IF NOT EXISTS pendency_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Main Pendencies Table
CREATE TABLE IF NOT EXISTS pendencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  human_readable_id INT GENERATED ALWAYS AS IDENTITY, -- Stable sequential identifier
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  tower_id UUID NOT NULL REFERENCES towers(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  type_id UUID NOT NULL REFERENCES pendency_types(id) ON DELETE RESTRICT,
  criticality TEXT NOT NULL CHECK (criticality IN ('critical', 'non_critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  description TEXT NOT NULL,
  opened_on DATE NOT NULL DEFAULT CURRENT_DATE,
  current_cbe_date DATE,
  status_remarks TEXT,
  closed_on DATE,
  created_by TEXT NOT NULL DEFAULT 'Unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT NOT NULL DEFAULT 'Unknown',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CBE History Audit Table (Tracks every shift in Committed By Estimate date)
CREATE TABLE IF NOT EXISTS cbe_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pendency_id UUID NOT NULL REFERENCES pendencies(id) ON DELETE CASCADE,
  previous_cbe_date DATE,
  new_cbe_date DATE NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'Unknown',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT
);

-- 7. Pendency Comments Table
CREATE TABLE IF NOT EXISTS pendency_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pendency_id UUID NOT NULL REFERENCES pendencies(id) ON DELETE CASCADE,
  author TEXT NOT NULL DEFAULT 'Unknown',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Pendency Attachments Table
CREATE TABLE IF NOT EXISTS pendency_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pendency_id UUID NOT NULL REFERENCES pendencies(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by TEXT NOT NULL DEFAULT 'Unknown',
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========================================================
-- TRIGGERS & FUNCTIONS
-- ========================================================

-- Trigger 1: Auto-update updated_at timestamp BEFORE UPDATE
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

-- Trigger 2: Track CBE date changes AFTER UPDATE (ensures parent row exists for FK)
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

-- Trigger 3: Auto-set closed_on date when status becomes 'closed'
CREATE OR REPLACE FUNCTION fn_auto_close_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND (OLD.status IS NULL OR OLD.status = 'open') THEN
    NEW.closed_on = COALESCE(NEW.closed_on, CURRENT_DATE);
  ELSIF NEW.status = 'open' THEN
    NEW.closed_on = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_close ON pendencies;
CREATE TRIGGER trg_auto_close
BEFORE UPDATE ON pendencies
FOR EACH ROW EXECUTE FUNCTION fn_auto_close_date();

-- ========================================================
-- VIEW: v_pendency_dashboard
-- ========================================================

CREATE OR REPLACE VIEW v_pendency_dashboard AS
SELECT
  p.id,
  p.human_readable_id,
  p.project_id,
  pr.name AS project_name,
  p.tower_id,
  t.name AS tower_name,
  p.department_id,
  d.name AS department_name,
  p.type_id,
  pt.name AS type_name,
  p.criticality,
  p.status,
  p.description,
  p.opened_on,
  p.current_cbe_date,
  p.status_remarks,
  p.closed_on,
  p.created_by,
  p.created_at,
  p.updated_by,
  p.updated_at,
  
  -- Derived: Days Open
  CASE 
    WHEN p.status = 'closed' AND p.closed_on IS NOT NULL THEN (p.closed_on - p.opened_on)
    ELSE (CURRENT_DATE - p.opened_on)
  END AS days_open,

  -- Derived: Is Overdue
  (p.status = 'open' AND p.current_cbe_date IS NOT NULL AND p.current_cbe_date < CURRENT_DATE) AS is_overdue,

  -- Derived: Days Since CBE Due
  CASE 
    WHEN p.status = 'open' AND p.current_cbe_date IS NOT NULL AND p.current_cbe_date < CURRENT_DATE 
    THEN (CURRENT_DATE - p.current_cbe_date)
    ELSE 0 
  END AS days_since_cbe_due,

  -- Derived: On Track Status
  CASE
    WHEN p.status = 'closed' THEN 'Closed'
    WHEN p.status = 'open' AND p.current_cbe_date IS NULL THEN 'Awaiting CBE'
    WHEN p.status = 'open' AND p.current_cbe_date >= CURRENT_DATE THEN 'On Track'
    WHEN p.status = 'open' AND p.current_cbe_date < CURRENT_DATE THEN 'Delayed'
  END AS on_track_status,

  -- Derived: Count of CBE date shifts
  COALESCE(ch.cbe_change_count, 0) AS cbe_change_count

FROM pendencies p
JOIN projects pr ON pr.id = p.project_id
JOIN towers t ON t.id = p.tower_id
JOIN departments d ON d.id = p.department_id
JOIN pendency_types pt ON pt.id = p.type_id
LEFT JOIN (
  SELECT pendency_id, COUNT(*) AS cbe_change_count
  FROM cbe_history
  GROUP BY pendency_id
) ch ON ch.pendency_id = p.id;

-- ========================================================
-- INDEXES
-- ========================================================

CREATE INDEX IF NOT EXISTS idx_pendencies_status ON pendencies(status);
CREATE INDEX IF NOT EXISTS idx_pendencies_department ON pendencies(department_id);
CREATE INDEX IF NOT EXISTS idx_pendencies_project ON pendencies(project_id);
CREATE INDEX IF NOT EXISTS idx_pendencies_tower ON pendencies(tower_id);
CREATE INDEX IF NOT EXISTS idx_pendencies_cbe_date ON pendencies(current_cbe_date);
CREATE INDEX IF NOT EXISTS idx_pendencies_criticality ON pendencies(criticality);
CREATE INDEX IF NOT EXISTS idx_cbe_history_pendency ON cbe_history(pendency_id);
CREATE INDEX IF NOT EXISTS idx_comments_pendency ON pendency_comments(pendency_id);
CREATE INDEX IF NOT EXISTS idx_attachments_pendency ON pendency_attachments(pendency_id);
