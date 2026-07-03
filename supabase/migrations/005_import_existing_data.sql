-- ========================================================================
-- Construction Pendency Tracker - Migration 005: Existing Data Import
-- Inserts the 17 legacy Excel pendencies mapped into normalized DB schema.
-- ========================================================================

DO $$
DECLARE
  v_proj_id UUID;
  v_tow_p3 UUID;
  v_tow_t10 UUID;
  v_tow_t7t8 UUID;
  
  v_dept_cp UUID;
  v_dept_cb_civil UUID;
  v_dept_design UUID;
  
  v_type_work_award UUID;
  v_type_drawing_appr UUID;
  v_type_extra_item UUID;
  v_type_sample_appr UUID;
  v_type_cost_hit UUID;
  v_type_descope UUID;
  v_type_data_req UUID;
  v_type_shop_drawing UUID;

  v_p_id UUID;
BEGIN
  -- 1. Ensure Project 'Woods'
  SELECT id INTO v_proj_id FROM projects WHERE name = 'Woods' LIMIT 1;
  IF v_proj_id IS NULL THEN
    INSERT INTO projects (name) VALUES ('Woods') RETURNING id INTO v_proj_id;
  END IF;

  -- 2. Ensure Towers
  INSERT INTO towers (project_id, name) VALUES (v_proj_id, 'Phase 3') ON CONFLICT DO NOTHING;
  INSERT INTO towers (project_id, name) VALUES (v_proj_id, 'Phase 3 Tower 10') ON CONFLICT DO NOTHING;
  INSERT INTO towers (project_id, name) VALUES (v_proj_id, 'T7 & T8') ON CONFLICT DO NOTHING;

  SELECT id INTO v_tow_p3 FROM towers WHERE project_id = v_proj_id AND name = 'Phase 3';
  SELECT id INTO v_tow_t10 FROM towers WHERE project_id = v_proj_id AND name = 'Phase 3 Tower 10';
  SELECT id INTO v_tow_t7t8 FROM towers WHERE project_id = v_proj_id AND name = 'T7 & T8';

  -- 3. Resolve Departments
  SELECT id INTO v_dept_cp FROM departments WHERE name = 'C&P';
  SELECT id INTO v_dept_cb_civil FROM departments WHERE name = 'C&B - Civil';
  SELECT id INTO v_dept_design FROM departments WHERE name = 'Design';

  -- 4. Resolve Pendency Types
  SELECT id INTO v_type_work_award FROM pendency_types WHERE name = 'Work award';
  SELECT id INTO v_type_drawing_appr FROM pendency_types WHERE name = 'Drawing approval';
  SELECT id INTO v_type_extra_item FROM pendency_types WHERE name = 'Extra item approval';
  SELECT id INTO v_type_sample_appr FROM pendency_types WHERE name = 'Sample approval';
  SELECT id INTO v_type_cost_hit FROM pendency_types WHERE name = 'Cost hit approval';
  SELECT id INTO v_type_descope FROM pendency_types WHERE name = 'Descope';
  SELECT id INTO v_type_data_req FROM pendency_types WHERE name = 'Data required';
  SELECT id INTO v_type_shop_drawing FROM pendency_types WHERE name = 'Shop drawing approval';

  -- 5. Insert Pendency Items

  -- Item 1 (SN 205)
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_cp, v_type_work_award, 'non_critical', 'open',
    'Work Award for procurement of terrace booster pumps (Phase 3)',
    '2026-04-15', NULL,
    'Tender package shared with C&P on 15-Apr-2026 for work award. Technical Data Sheet (TDS) approval pending at site.',
    'System Import', 'System Import'
  );

  -- Item 2 (SN 207) - Has 1 CBE shift
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_t10, v_dept_design, v_type_drawing_appr, 'critical', 'open',
    'Glass box shop drawing approval for Tower 10',
    '2026-02-10', NULL,
    'Shop drawing shared with Façade team on 10-Feb-2026. Vendor alignment meeting completed; revised shop drawing awaited from vendor (pending since 3-Jun-2026). Comments provided on 24-Jun-2026.',
    'System Import', 'System Import'
  ) RETURNING id INTO v_p_id;

  INSERT INTO cbe_history (pendency_id, previous_cbe_date, new_cbe_date, changed_by, reason)
  VALUES (v_p_id, '2026-06-03', '2026-06-24', 'Façade Team', 'Vendor requested extension for revised calculations');

  -- Item 3
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_t7t8, v_dept_cp, v_type_extra_item, 'critical', 'open',
    'Extra item of balance painting works (M/s Anam & M/s Izhar)',
    '2026-05-18', NULL,
    'In-principle approval shared with C&P on 18-May-2026 for further processing. Descope of M/s Asian Paints requested and under approval; vendor discussion required.',
    'System Import', 'System Import'
  );

  -- Item 4 - Has 1 CBE shift
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_cp, v_type_extra_item, 'non_critical', 'open',
    'Extra item rate approval for M/s Starmercantile',
    '2026-06-08', '2026-07-03',
    'In-principle approval shared with C&P team on 5-Jun-2026 for further processing.',
    'System Import', 'System Import'
  ) RETURNING id INTO v_p_id;

  INSERT INTO cbe_history (pendency_id, previous_cbe_date, new_cbe_date, changed_by, reason)
  VALUES (v_p_id, '2026-06-25', '2026-07-03', 'C&P Lead', 'Commercial verification window extended');

  -- Item 5
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_cp, v_type_extra_item, 'non_critical', 'open',
    'Extra item approval for M/s RR Parkon',
    '2026-06-05', NULL,
    'In-principle approval shared with C&P team on 5-Jun-2026 for further processing. Commercial discussion required with vendor.',
    'System Import', 'System Import'
  );

  -- Item 6
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_cb_civil, v_type_cost_hit, 'non_critical', 'open',
    'Italian marble additional budget & design wastage approval',
    '2026-05-25', NULL,
    'In-principle approval for additional budget provided to C&P on 9-May-2026. C&P shared approval with C&B for amendment on 25-May-2026. Vendor not agreeable to approved wastage; negotiations ongoing.',
    'System Import', 'System Import'
  );

  -- Item 7
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_design, v_type_data_req, 'critical', 'open',
    'Entrance glass lighting details for Tower 9 & Tower 10',
    '2026-05-21', NULL,
    'Pending at Design team. M/s RJD to incorporate lighting details and share shop drawing along with lighting options for finalization as discussed on 1-Jun-2026.',
    'System Import', 'System Import'
  );

  -- Item 8
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_design, v_type_sample_appr, 'critical', 'open',
    'ODU Shaft Louvers sample approval for Tower 9 & Tower 10',
    '2025-12-12', '2026-06-10',
    'Design team approved shop drawing and requested re-sampling for façade approval. Vendor to submit revised drawing incorporating comments. Shop drawing approved; final sample approval awaited.',
    'System Import', 'System Import'
  );

  -- Item 9
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_design, v_type_data_req, 'critical', 'open',
    'GRC Jali shop drawing & structural calculation approval (Phase 3)',
    '2026-05-13', NULL,
    'Vendor submitted revised drawing. Comments shared on 6-Jun-2026 and 24-Jun-2026. Revised structural calculation drawing awaited from vendor.',
    'System Import', 'System Import'
  );

  -- Item 10
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_design, v_type_shop_drawing, 'non_critical', 'open',
    'Wooden flooring shop drawing & sample approval for Phase 3 Club (M/s RJD)',
    '2026-06-03', NULL,
    'Shop drawing shared by M/s RJD on 3-Jun-2026. Physical sample submitted on 22-Jun-2026 for approval.',
    'System Import', 'System Import'
  );

  -- Item 11
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_design, v_type_extra_item, 'critical', 'open',
    'Extra item rate approval for M/s Kove Arts (Phase 3)',
    '2026-06-02', '2026-06-16',
    'In-principle approval shared with C&P on 2-Jun-2026 for further processing.',
    'System Import', 'System Import'
  );

  -- Item 12 (SN 976)
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_cp, v_type_work_award, 'non_critical', 'open',
    'Work Award for façade lights of Tower 9 & Tower 10',
    '2026-06-25', '2026-07-25',
    'Tender package shared with C&P on 25-Jun-2026 for further work award process.',
    'System Import', 'System Import'
  );

  -- Item 13 (SN 977)
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_cp, v_type_descope, 'critical', 'open',
    'Descope approval of M/s Asian Paints',
    '2026-06-02', NULL,
    'In-principle approval shared with C&P on 2-Jun-2026 for further processing.',
    'System Import', 'System Import'
  );

  -- Item 14 (SN 967)
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_design, v_type_data_req, 'critical', 'open',
    'Tower 9 entrance foyer boxing details & sample approval',
    '2026-06-22', NULL,
    'Sample submitted by vendor on 22-Jun-2026 for design review.',
    'System Import', 'System Import'
  );

  -- Item 15 (SN 968)
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_design, v_type_sample_appr, 'critical', 'open',
    'Tower 10 wardrobe sample selection & approval',
    '2026-06-23', NULL,
    'E-catalogue submitted to Design team for sample finalization and approval.',
    'System Import', 'System Import'
  );

  -- Item 16 (SN 978a)
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_design, v_type_drawing_appr, 'critical', 'open',
    'Kitchen countertop stone & chimney cover finalization',
    '2026-06-06', NULL,
    'Kitchen sample approved except countertop and chimney cover. Revised shop drawing requested by design team on 6-Jun-2026.',
    'System Import', 'System Import'
  );

  -- Item 17 (SN 978b)
  INSERT INTO pendencies (
    project_id, tower_id, department_id, type_id, criticality, status,
    description, opened_on, current_cbe_date, status_remarks, created_by, updated_by
  ) VALUES (
    v_proj_id, v_tow_p3, v_dept_cp, v_type_extra_item, 'non_critical', 'open',
    'Extra item approval for M/s RA Trading',
    '2026-06-16', '2026-07-05',
    'In-principle approval shared with C&P on 16-Jun-2026 for further processing. Descope discussion pending.',
    'System Import', 'System Import'
  );

END $$;
