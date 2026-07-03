'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Edit2, Check, X, Building, Layers, Bell, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Department, PendencyType, Project, Tower } from '@/lib/types';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'departments' | 'types' | 'projects' | 'notifications'>('departments');

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

  useEffect(() => {
    fetchLookups();
  }, []);

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
          Manage departments, editable pendency lookup types, project towers, and notification rules.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border text-xs font-semibold">
        {(['departments', 'types', 'projects', 'notifications'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-4 border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'types' ? 'Pendency Types' : tab === 'projects' ? 'Projects & Towers' : tab}
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
      </div>
    </div>
  );
}
