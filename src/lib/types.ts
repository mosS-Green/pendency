export type Criticality = 'critical' | 'non_critical';
export type PendencyStatus = 'open' | 'closed';
export type OnTrackStatus = 'Awaiting CBE' | 'On Track' | 'Delayed' | 'Closed';

export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export interface Tower {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface PendencyType {
  id: string;
  name: string;
  created_at: string;
}

export interface Pendency {
  id: string;
  human_readable_id: number;
  project_id: string;
  tower_id: string;
  department_id: string;
  type_id: string;
  criticality: Criticality;
  status: PendencyStatus;
  description: string;
  opened_on: string;
  current_cbe_date: string | null;
  status_remarks: string | null;
  closed_on: string | null;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

export interface PendencyDashboardView extends Pendency {
  project_name: string;
  tower_name: string;
  department_name: string;
  type_name: string;
  days_open: number;
  is_overdue: boolean;
  days_since_cbe_due: number | null;
  on_track_status: OnTrackStatus;
  cbe_change_count: number;
}

export interface CBEHistoryItem {
  id: string;
  pendency_id: string;
  previous_cbe_date: string | null;
  new_cbe_date: string;
  changed_by: string;
  changed_at: string;
  reason: string | null;
}

export interface PendencyComment {
  id: string;
  pendency_id: string;
  author: string;
  body: string;
  created_at: string;
}

export interface PendencyAttachment {
  id: string;
  pendency_id: string;
  file_url: string;
  file_name: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface PendencyFilters {
  search: string;
  department_ids: string[];
  tower_ids: string[];
  project_id: string | null;
  criticality: Criticality | 'all';
  status: PendencyStatus | 'all';
  on_track_status: OnTrackStatus | 'all';
  type_ids: string[];
  date_from: string | null;
  date_to: string | null;
}

export interface UserNotification {
  id: string;
  pendency_id: string;
  human_readable_id: number;
  title: string;
  body: string;
  type: 'cbe_due' | 'overdue' | 'stale';
  date: string;
  read: boolean;
}
