-- ========================================================================
-- Construction Pendency Tracker - Migration 002 (CLEAN PRODUCTION VERSION)
-- Seeds ONLY lookups: 6 Departments, Pendency Types, and Project 'Woods'.
-- Contains NO sample/fake pendency items.
-- ========================================================================

TRUNCATE pendency_attachments, pendency_comments, cbe_history, pendencies, pendency_types, departments, towers, projects RESTART IDENTITY CASCADE;

-- 1. Seed Departments (Exact 6 required)
INSERT INTO departments (id, name, display_order) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'C&P', 1),
  ('a0000000-0000-0000-0000-000000000002', 'C&B - Civil', 2),
  ('a0000000-0000-0000-0000-000000000003', 'C&B - MEP', 3),
  ('a0000000-0000-0000-0000-000000000004', 'Design', 4),
  ('a0000000-0000-0000-0000-000000000005', 'Planning', 5),
  ('a0000000-0000-0000-0000-000000000006', 'Site', 6);

-- 2. Seed Pendency Types (Editable Lookup)
INSERT INTO pendency_types (id, name) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Work award'),
  ('b0000000-0000-0000-0000-000000000002', 'Drawing approval'),
  ('b0000000-0000-0000-0000-000000000003', 'Extra item approval'),
  ('b0000000-0000-0000-0000-000000000004', 'Sample approval'),
  ('b0000000-0000-0000-0000-000000000005', 'Cost hit approval'),
  ('b0000000-0000-0000-0000-000000000006', 'Descope'),
  ('b0000000-0000-0000-0000-000000000007', 'Data required'),
  ('b0000000-0000-0000-0000-000000000008', 'Shop drawing approval');

-- 3. Seed Primary Project "Woods"
INSERT INTO projects (id, name) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Woods');
