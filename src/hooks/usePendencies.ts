'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  PendencyDashboardView,
  PendencyFilters,
  Department,
  Tower,
  Project,
  PendencyType,
} from '@/lib/types';

export function usePendencies(initialFilters?: Partial<PendencyFilters>) {
  const [pendencies, setPendencies] = useState<PendencyDashboardView[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [types, setTypes] = useState<PendencyType[]>([]);

  // Fetch Lookups
  const fetchLookups = useCallback(async () => {
    try {
      const [deptRes, towerRes, projRes, typeRes] = await Promise.all([
        supabase.from('departments').select('*').order('display_order', { ascending: true }),
        supabase.from('towers').select('*').order('name', { ascending: true }),
        supabase.from('projects').select('*').order('name', { ascending: true }),
        supabase.from('pendency_types').select('*').order('name', { ascending: true }),
      ]);

      let finalTowers = towerRes.data || [];
      let finalTypes = typeRes.data || [];

      if (typeof window !== 'undefined') {
        // Merge towers
        try {
          const localTowersStr = localStorage.getItem('local_towers');
          if (localTowersStr) {
            const localTowersList: string[] = JSON.parse(localTowersStr);
            const defaultProjectId = projRes.data?.[0]?.id || 'c0000000-0000-0000-0000-000000000001';
            localTowersList.forEach((name) => {
              if (name && name.trim() && !finalTowers.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) {
                finalTowers.push({
                  id: `local-${name.trim().toLowerCase()}`,
                  project_id: defaultProjectId,
                  name: name.trim(),
                  created_at: new Date().toISOString(),
                });
              }
            });
          }
        } catch (e) {
          console.error('Error loading local towers:', e);
        }

        // Merge types
        try {
          const localTypesStr = localStorage.getItem('local_pendency_types');
          if (localTypesStr) {
            const localTypesList: string[] = JSON.parse(localTypesStr);
            localTypesList.forEach((name) => {
              if (name && name.trim() && !finalTypes.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) {
                finalTypes.push({
                  id: `local-${name.trim().toLowerCase()}`,
                  name: name.trim(),
                  created_at: new Date().toISOString(),
                });
              }
            });
          }
        } catch (e) {
          console.error('Error loading local types:', e);
        }
      }

      if (deptRes.data) setDepartments(deptRes.data);
      setTowers(finalTowers);
      if (projRes.data) setProjects(projRes.data);
      setTypes(finalTypes);
    } catch (err) {
      console.error('Error fetching lookups:', err);
    }
  }, []);

  // Fetch Pendencies View
  const fetchPendencies = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('v_pendency_dashboard')
        .select('*')
        .order('human_readable_id', { ascending: false });

      if (error) {
        console.error('Error loading pendencies:', error);
      } else if (data) {
        setPendencies(data as PendencyDashboardView[]);
      }
    } catch (err) {
      console.error('Failed to load pendencies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchAll = useCallback(async () => {
    await Promise.all([fetchLookups(), fetchPendencies()]);
  }, [fetchLookups, fetchPendencies]);

  useEffect(() => {
    fetchLookups();
    fetchPendencies();
  }, [fetchLookups, fetchPendencies]);

  // 1-Click Inline Update Functions with Optimistic UI updates
  const updateCBEDate = async (id: string, newDate: string | null, userName: string, reason?: string) => {
    // Optimistic state update
    setPendencies((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              current_cbe_date: newDate,
              cbe_change_count: item.cbe_change_count + 1,
              updated_by: userName,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    const { error } = await supabase
      .from('pendencies')
      .update({
        current_cbe_date: newDate,
        updated_by: userName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to update CBE date:', error);
      fetchPendencies(); // Rollback on failure
      return false;
    }

    fetchPendencies();
    return true;
  };

  const updateStatus = async (id: string, newStatus: 'open' | 'closed', userName: string) => {
    const closedOn = newStatus === 'closed' ? new Date().toISOString().split('T')[0] : null;

    setPendencies((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: newStatus,
              closed_on: closedOn,
              updated_by: userName,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    const { error } = await supabase
      .from('pendencies')
      .update({
        status: newStatus,
        closed_on: closedOn,
        updated_by: userName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to update status:', error);
      fetchPendencies();
      return false;
    }

    fetchPendencies();
    return true;
  };

  const updateRemarks = async (id: string, newRemarks: string, userName: string) => {
    setPendencies((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status_remarks: newRemarks,
              updated_by: userName,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    );

    const { error } = await supabase
      .from('pendencies')
      .update({
        status_remarks: newRemarks,
        updated_by: userName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Failed to update remarks:', error);
      fetchPendencies();
      return false;
    }

    return true;
  };

  const createPendency = async (newRecord: Partial<PendencyDashboardView>, userName: string) => {
    const payload = {
      project_id: newRecord.project_id,
      tower_id: newRecord.tower_id,
      department_id: newRecord.department_id,
      type_id: newRecord.type_id,
      criticality: newRecord.criticality,
      status: 'open',
      description: newRecord.description,
      opened_on: newRecord.opened_on || new Date().toISOString().split('T')[0],
      current_cbe_date: newRecord.current_cbe_date || null,
      status_remarks: newRecord.status_remarks || null,
      created_by: userName,
      updated_by: userName,
    };

    const { data, error } = await supabase.from('pendencies').insert(payload).select().single();

    if (error) {
      console.error('Failed to create pendency:', error);
      return null;
    }

    await refetchAll();
    return data;
  };

  return {
    pendencies,
    loading,
    departments,
    towers,
    projects,
    types,
    refetch: refetchAll,
    updateCBEDate,
    updateStatus,
    updateRemarks,
    createPendency,
  };
}
