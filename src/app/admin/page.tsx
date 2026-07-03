'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Check, X, Building, Layers, Bell, Shield, Copy, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Department, PendencyType, Project, Tower } from '@/lib/types';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'departments' | 'types' | 'projects' | 'notifications' | 'duplicates'>('departments');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [types, setTypes] = useState<PendencyType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newDeptName, setNewDeptName] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [newTowerName, setNewTowerName] = useState('');

  // Threshold state
  const [criticalDays, setCriticalDays] = useState(3);
  const [nonCriticalDays, setNonCriticalDays] = useState(7);

  // Duplicate state
  const [duplicateGroupsCount, setDuplicateGroupsCount] = useState<number>(0);
  const [duplicateCopiesCount, setDuplicateCopiesCount] = useState<number>(0);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeStatusMsg, setMergeStatusMsg] = useState<string | null>(null);

  const fetchLookups = async () => {
    setLoading(true);
    const [deptRes, typeRes, projRes, towerRes] = await Promise.all([
      supabase.from('departments').select('*').order('display_order', { ascending: true }),
      supabase.from('pendency_types').select('*').order('name', { ascending: true }),
      supabase.from('projects').select('*').order('name', { ascending: true }),
      supabase.from('towers').select('*').order('name', { ascending: true }),
    ]);

    if (deptRes.data) setDepartments(deptRes.data);
    if (typeRes.data) setTypes(typeRes.data);
    if (projRes.data) setProjects(projRes.data);
    if (towerRes.data) setTowers(towerRes.data);
    setLoading(false);
  };

  const scanDuplicates = async () => {
    const { data } = await supabase
      .from('pendencies')
      .select('id, description, created_at, human_readable_id')
      .order('created_at', { ascending: true });

    if (!data) return;

    const groups: Record<string, typeof data> = {};
    data.forEach((item) => {
      const key = (item.description || '').trim().toLowerCase();
      if (!key) return;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    let gCount = 0;
    let cCount = 0;
    Object.values(groups).forEach((group) => {
      if (group.length > 1) {
        gCount++;
        cCount += group.length - 1;
      }
    });

    setDuplicateGroupsCount(gCount);
    setDuplicateCopiesCount(cCount);
  };

  useEffect(() => {
    fetchLookups();
    scanDuplicates();
  }, []);

  useEffect(() => {
    if (activeTab === 'duplicates') {
      scanDuplicates();
    }
  }, [activeTab]);

  const handleMergeDuplicates = async () => {
    if (duplicateCopiesCount === 0) {
      setMergeStatusMsg('No duplicate entries found.');
      return;
    }

    if (!confirm(`Are you sure you want to merge all duplicates? This will delete ${duplicateCopiesCount} duplicate copy/copies, leaving 1 original copy intact for each title.`)) {
      return;
    }

    setIsMerging(true);
    setMergeStatusMsg(null);

    try {
      const { data, error } = await supabase
        .from('pendencies')
        .select('id, description, created_at, human_readable_id')
        .order('created_at', { ascending: true });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to fetch pendencies for deduplication');
      }

      const groups: Record<string, typeof data> = {};
      data.forEach((item) => {
        const key = (item.description || '').trim().toLowerCase();
        if (!key) return;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      });

      const duplicateIds: string[] = [];
      Object.values(groups).forEach((group) => {
        if (group.length > 1) {
          // Keep group[0] intact, collect group[1..N] for deletion
          for (let i = 1; i < group.length; i++) {
            duplicateIds.push(group[i].id);
          }
        }
      });

      if (duplicateIds.length > 0) {
        // 1. Delete associated cbe_history to maintain foreign key constraint integrity
        await supabase.from('cbe_history').delete().in('pendency_id', duplicateIds);

        // 2. Delete duplicate pendency rows
        const deleteRes = await supabase.from('pendencies').delete().in('id', duplicateIds);
        if (deleteRes.error) {
          throw deleteRes.error;
        }

        setMergeStatusMsg(`Successfully merged duplicates! Removed ${duplicateIds.length} duplicate copy/copies and kept 1 original intact for each title.`);
      } else {
        setMergeStatusMsg('No duplicates were found to merge.');
      }

      await scanDuplicates();
    } catch (err: any) {
      setMergeStatusMsg(`Error merging duplicates: ${err.message || 'Unknown error'}`);
    } finally {
      setIsMerging(false);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const { error } = await supabase.from('departments').insert({
      name: newDeptName.trim(),
      display_order: departments.length + 1,
    });
    if (!error) {
      setNewDeptName('');
      fetchLookups();
    }
  };

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    const { error } = await supabase.from('pendency_types').insert({
      name: newTypeName.trim(),
    });
    if (!error) {
      setNewTypeName('');
      fetchLookups();
    }
  };

  const handleAddTower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTowerName.trim() || projects.length === 0) return;
    const { error } = await supabase.from('towers').insert({
      project_id: projects[0].id,
      name: newTowerName.trim(),
    });
    if (!error) {
      setNewTowerName('');
      fetchLookups();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" /> Admin Settings & Lookup Management
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage departments, editable pendency lookup types, project towers, notification rules, and duplicate data maintenance.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-semibold overflow-x-auto">
        {(['departments', 'types', 'projects', 'notifications', 'duplicates'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-4 border-b-2 transition-colors capitalize shrink-0 ${
              activeTab === tab
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'types'
              ? 'Pendency Types'
              : tab === 'projects'
              ? 'Projects & Towers'
              : tab === 'duplicates'
              ? 'Merge Duplicates'
              : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="text-xs">
        {activeTab === 'departments' && (
          <div className="space-y-4">
            <form onSubmit={handleAddDept} className="flex gap-2">
              <input
                type="text"
                placeholder="New department name (e.g. Quality Assurance)..."
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover"
              >
                <Plus className="w-4 h-4" /> Add Dept
              </button>
            </form>

            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {departments.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-muted-foreground">#{d.display_order}</span>
                    <span className="font-semibold text-foreground">{d.name}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Admin Editable Lookup</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'types' && (
          <div className="space-y-4">
            <form onSubmit={handleAddType} className="flex gap-2">
              <input
                type="text"
                placeholder="New pendency type (e.g. Statutory Approval)..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover"
              >
                <Plus className="w-4 h-4" /> Add Type
              </button>
            </form>

            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {types.map((tp) => (
                <div key={tp.id} className="flex items-center justify-between p-3">
                  <span className="font-semibold text-foreground">{tp.name}</span>
                  <span className="text-[11px] text-muted-foreground">Editable Lookup</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg border border-border bg-muted/40 font-medium">
              Active Project: <strong className="text-primary">{projects[0]?.name || 'Woods'}</strong>
            </div>

            <form onSubmit={handleAddTower} className="flex gap-2">
              <input
                type="text"
                placeholder="New tower name (e.g. Tower D, Clubhouse)..."
                value={newTowerName}
                onChange={(e) => setNewTowerName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover"
              >
                <Plus className="w-4 h-4" /> Add Tower
              </button>
            </form>

            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {towers.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3">
                  <span className="font-semibold text-foreground">{t.name}</span>
                  <span className="text-[11px] text-muted-foreground">Project: {projects[0]?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground text-sm">Client-Side Reminder Nag Thresholds</h4>
                <p className="text-muted-foreground text-xs">
                  Configure after how many days open (or overdue) browser reminders fire for critical vs non-critical pendencies.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Critical Item Nag Threshold (Days)</label>
                <input
                  type="number"
                  value={criticalDays}
                  onChange={(e) => setCriticalDays(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                />
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Non-Critical Nag Threshold (Days)</label>
                <input
                  type="number"
                  value={nonCriticalDays}
                  onChange={(e) => setNonCriticalDays(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-input bg-background"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'duplicates' && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <Copy className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-foreground text-sm">Merge Duplicate Pendency Entries</h4>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Scans the database for items with identical titles/descriptions. Merging will keep 1 original copy intact (earliest created) and delete the duplicate copies.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg border border-border bg-background flex items-center justify-between">
                <div>
                  <div className="text-muted-foreground text-[11px] font-medium">Duplicate Title Groups</div>
                  <div className="text-lg font-bold text-foreground font-mono">{duplicateGroupsCount}</div>
                </div>
                <AlertTriangle className="w-5 h-5 text-amber-500 opacity-80" />
              </div>

              <div className="p-3 rounded-lg border border-border bg-background flex items-center justify-between">
                <div>
                  <div className="text-muted-foreground text-[11px] font-medium">Redundant Copies to Remove</div>
                  <div className="text-lg font-bold text-foreground font-mono">{duplicateCopiesCount}</div>
                </div>
                <Trash2 className="w-5 h-5 text-rose-500 opacity-80" />
              </div>
            </div>

            {mergeStatusMsg && (
              <div className="p-3 rounded-lg border border-border bg-muted/60 text-foreground text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{mergeStatusMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleMergeDuplicates}
                disabled={isMerging || duplicateCopiesCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                {isMerging ? 'Merging Duplicates...' : 'Merge All Duplicates'}
              </button>

              <button
                onClick={scanDuplicates}
                disabled={isMerging}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-medium text-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                Re-scan Database
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
