import * as XLSX from 'xlsx';
import { PendencyDashboardView, CBEHistoryItem } from './types';

export function exportPendenciesToExcel(
  pendencies: PendencyDashboardView[],
  fileName = 'Woods_Construction_Pendency_Tracker.xlsx'
) {
  // Format rows matching original excel spirit but with clean computed fields
  const dataRows = pendencies.map((p, index) => ({
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

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Auto-fit column widths
  const max_widths = [
    { wch: 6 },  // SN
    { wch: 10 }, // Item ID
    { wch: 12 }, // Project
    { wch: 12 }, // Tower
    { wch: 16 }, // Department
    { wch: 20 }, // Type
    { wch: 14 }, // Criticality
    { wch: 45 }, // Description
    { wch: 12 }, // Opened On
    { wch: 16 }, // Current CBE
    { wch: 18 }, // CBE Changes
    { wch: 10 }, // Days Open
    { wch: 12 }, // Days Overdue
    { wch: 14 }, // Delivery State
    { wch: 10 }, // Status
    { wch: 35 }, // Remarks
    { wch: 12 }, // Closed On
    { wch: 18 }, // Updated By
    { wch: 14 }, // Updated On
  ];
  worksheet['!cols'] = max_widths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Active Pendencies');

  // Write file to browser download
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
