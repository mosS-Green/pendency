import * as XLSX from 'xlsx';
import { PendencyDashboardView, CBEHistoryItem, Department, Tower, Project, PendencyType } from './types';
import { supabase } from './supabase';

export const EXPORT_HEADERS = [
  'SN',
  'Item ID',
  'Project',
  'Tower',
  'Department',
  'Type',
  'Criticality',
  'Description',
  'Opened On',
  'Current CBE Date',
  'CBE Changes Count',
  'Days Open',
  'Days Overdue',
  'Delivery State',
  'Status',
  'Status Remarks',
  'Closed On',
  'Last Updated By',
  'Last Updated On',
];

export function exportPendenciesToExcel(
  pendencies: PendencyDashboardView[],
  fileName = 'Woods_Construction_Pendency_Tracker.xlsx'
) {
  let dataRows: Record<string, any>[] = [];

  if (pendencies.length === 0) {
    // Produce empty template with defined headers
    const emptyRow: Record<string, any> = {};
    EXPORT_HEADERS.forEach((header) => {
      emptyRow[header] = '';
    });
    dataRows = [emptyRow];
  } else {
    dataRows = pendencies.map((p, index) => ({
      'SN': index + 1,
      'Item ID': `#${p.human_readable_id}`,
      'Project': p.project_name,
      'Tower': p.tower_name,
      'Department': p.department_name,
      'Type': p.type_name,
      'Criticality': p.criticality === 'critical' ? 'CRITICAL' : 'Non-Critical',
      'Description': p.description,
      'Opened On': p.opened_on,
      'Current CBE Date': p.current_cbe_date || 'Awaiting CBE',
      'CBE Changes Count': p.cbe_change_count,
      'Days Open': p.days_open,
      'Days Overdue': p.days_since_cbe_due || 0,
      'Delivery State': p.on_track_status,
      'Status': p.status.toUpperCase(),
      'Status Remarks': p.status_remarks || '',
      'Closed On': p.closed_on || '',
      'Last Updated By': p.updated_by,
      'Last Updated On': new Date(p.updated_at).toLocaleDateString(),
    }));
  }

  const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: EXPORT_HEADERS });

  // Auto-fit column widths
  const max_widths = [
    { wch: 6 },  // SN
    { wch: 10 }, // Item ID
    { wch: 12 }, // Project
    { wch: 14 }, // Tower
    { wch: 16 }, // Department
    { wch: 20 }, // Type
    { wch: 14 }, // Criticality
    { wch: 45 }, // Description
    { wch: 12 }, // Opened On
    { wch: 16 }, // Current CBE Date
    { wch: 18 }, // CBE Changes Count
    { wch: 10 }, // Days Open
    { wch: 12 }, // Days Overdue
    { wch: 14 }, // Delivery State
    { wch: 10 }, // Status
    { wch: 35 }, // Status Remarks
    { wch: 12 }, // Closed On
    { wch: 18 }, // Last Updated By
    { wch: 14 }, // Last Updated On
  ];
  worksheet['!cols'] = max_widths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pendencies');

  // Download browser XLSX
  XLSX.writeFile(workbook, fileName);
}

export function exportCBEAuditHistoryToExcel(
  historyItems: (CBEHistoryItem & { item_id?: string; description?: string })[],
  fileName = 'CBE_Slippage_Audit_Trail.xlsx'
) {
  const rows = historyItems.map((item, idx) => ({
    'SN': idx + 1,
    'Pendency ID': item.item_id || item.pendency_id,
    'Description': item.description || '',
    'Previous CBE Date': item.previous_cbe_date || 'Initial Set',
    'New CBE Date': item.new_cbe_date,
    'Changed By': item.changed_by,
    'Date Changed': new Date(item.changed_at).toLocaleString(),
    'Reason / Notes': item.reason || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CBE Slippage Audit');

  XLSX.writeFile(workbook, fileName);
}

/**
 * Parses uploaded XLSX file and imports pendencies into Supabase.
 */
export async function importPendenciesFromExcel(
  file: File,
  userName: string,
  departments: Department[],
  towers: Tower[],
  projects: Project[],
  types: PendencyType[]
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Fallback lookup defaults
      const defaultProject = projects[0] || { id: 'c0000000-0000-0000-0000-000000000001', name: 'Woods' };

      for (let i = 0; i < jsonRows.length; i++) {
        const row = jsonRows[i];
        const description = row['Description'] || row['description'];

        if (!description || !description.trim()) {
          continue; // Skip empty rows
        }

        // Match department
        const deptStr = (row['Department'] || row['department'] || '').toString().trim().toLowerCase();
        let dept = departments.find((d) => d.name.toLowerCase() === deptStr);
        if (!dept) dept = departments[0];

        // Match tower or auto-create if missing
        const towerStr = (row['Tower'] || row['tower'] || 'Tower 1').toString().trim();
        let tower = towers.find((t) => t.name.toLowerCase() === towerStr.toLowerCase());
        if (!tower) {
          const { data: newTower } = await supabase
            .from('towers')
            .insert({ project_id: defaultProject.id, name: towerStr })
            .select()
            .single();
          if (newTower) {
            tower = newTower as Tower;
            towers.push(tower);
          } else {
            tower = towers[0];
          }
        }

        // Match type or auto-create if missing
        const typeStr = (row['Type'] || row['type'] || 'Work award').toString().trim();
        let ptype = types.find((tp) => tp.name.toLowerCase() === typeStr.toLowerCase());
        if (!ptype) {
          const { data: newType } = await supabase
            .from('pendency_types')
            .insert({ name: typeStr })
            .select()
            .single();
          if (newType) {
            ptype = newType as PendencyType;
            types.push(ptype);
          } else {
            ptype = types[0];
          }
        }

        // Criticality
        const critStr = (row['Criticality'] || row['criticality'] || '').toString().trim().toLowerCase();
        const criticality = critStr.includes('crit') && !critStr.includes('non') ? 'critical' : 'non_critical';

        // Status
        const stStr = (row['Status'] || row['status'] || '').toString().trim().toLowerCase();
        const status = stStr === 'closed' ? 'closed' : 'open';

        // Dates
        let openedOn = row['Opened On'] || row['opened_on'];
        if (!openedOn || openedOn === '') {
          openedOn = new Date().toISOString().split('T')[0];
        }

        let cbeDate = row['Current CBE Date'] || row['current_cbe_date'] || row['CBE Date'];
        if (!cbeDate || cbeDate === 'Awaiting CBE' || cbeDate === '') {
          cbeDate = null;
        }

        const remarks = row['Status Remarks'] || row['status_remarks'] || row['Remarks'] || null;

        const { error } = await supabase.from('pendencies').insert({
          project_id: defaultProject.id,
          tower_id: tower?.id || towers[0]?.id,
          department_id: dept?.id || departments[0]?.id,
          type_id: ptype?.id || types[0]?.id,
          criticality,
          status,
          description: description.trim(),
          opened_on: openedOn,
          current_cbe_date: cbeDate,
          status_remarks: remarks,
          created_by: userName,
          updated_by: userName,
        });

        if (error) {
          errorCount++;
          errors.push(`Row ${i + 1}: ${error.message}`);
        } else {
          successCount++;
        }
      }

      resolve({ successCount, errorCount, errors });
    };

    reader.readAsArrayBuffer(file);
  });
}
