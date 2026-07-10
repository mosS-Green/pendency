'use client';

import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { Department, Tower, Project, PendencyType, Criticality } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  towers: Tower[];
  projects: Project[];
  types: PendencyType[];
  userName: string;
  onCreate: (record: any) => Promise<any>;
}

export function CreatePendencyModal({
  isOpen,
  onClose,
  departments,
  towers,
  projects,
  types,
  userName,
  onCreate,
}: Props) {
  const [formData, setFormData] = useState({
    project_id: projects[0]?.id || '',
    tower_name: '',
    department_id: departments[0]?.id || '',
    type_name: '',
    criticality: 'critical' as Criticality,
    description: '',
    current_cbe_date: '',
    status_remarks: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) return;

    setIsSubmitting(true);
    const defaultProject = projects[0] || { id: 'c0000000-0000-0000-0000-000000000001', name: 'Woods' };

    // 1. Resolve or Create Tower from text input
    let targetTowerId = null;
    const towerInputStr = formData.tower_name.trim() || 'General';
    const matchedTower = towers.find((t) => t.name.toLowerCase() === towerInputStr.toLowerCase());

    if (matchedTower && !matchedTower.id.startsWith('local-')) {
      targetTowerId = matchedTower.id;
    } else {
      // Not in DB or is local tag, check DB directly to be sure
      const { data: existingTower } = await supabase
        .from('towers')
        .select('id')
        .eq('project_id', defaultProject.id)
        .ilike('name', towerInputStr);

      if (existingTower && existingTower.length > 0) {
        targetTowerId = existingTower[0].id;
      } else {
        const { data: newTower } = await supabase
          .from('towers')
          .insert({ project_id: defaultProject.id, name: towerInputStr })
          .select()
          .single();
        if (newTower) {
          targetTowerId = newTower.id;
        } else {
          // Retry query in case of concurrency or previous insert
          const { data: retryTower } = await supabase
            .from('towers')
            .select('id')
            .eq('project_id', defaultProject.id)
            .ilike('name', towerInputStr);
          if (retryTower && retryTower.length > 0) {
            targetTowerId = retryTower[0].id;
          }
        }
      }
    }

    // Save tower/location to localStorage tags
    if (towerInputStr && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('local_towers');
        const list = stored ? JSON.parse(stored) : [];
        if (!list.some((name: string) => name.toLowerCase() === towerInputStr.toLowerCase())) {
          list.push(towerInputStr);
          localStorage.setItem('local_towers', JSON.stringify(list));
        }
      } catch (err) {
        console.error('Error saving local tower tag:', err);
      }
    }

    // 2. Resolve or Create Pendency Type from text input
    let targetTypeId = null;
    const typeInputStr = formData.type_name.trim() || 'General';
    const matchedType = types.find((tp) => tp.name.toLowerCase() === typeInputStr.toLowerCase());

    if (matchedType && !matchedType.id.startsWith('local-')) {
      targetTypeId = matchedType.id;
    } else {
      // Not in DB or is local tag, check DB directly
      const { data: existingType } = await supabase
        .from('pendency_types')
        .select('id')
        .ilike('name', typeInputStr);

      if (existingType && existingType.length > 0) {
        targetTypeId = existingType[0].id;
      } else {
        const { data: newType } = await supabase
          .from('pendency_types')
          .insert({ name: typeInputStr })
          .select()
          .single();
        if (newType) {
          targetTypeId = newType.id;
        } else {
          // Retry query
          const { data: retryType } = await supabase
            .from('pendency_types')
            .select('id')
            .ilike('name', typeInputStr);
          if (retryType && retryType.length > 0) {
            targetTypeId = retryType[0].id;
          }
        }
      }
    }

    // Save type to localStorage tags
    if (typeInputStr && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('local_pendency_types');
        const list = stored ? JSON.parse(stored) : [];
        if (!list.some((name: string) => name.toLowerCase() === typeInputStr.toLowerCase())) {
          list.push(typeInputStr);
          localStorage.setItem('local_pendency_types', JSON.stringify(list));
        }
      } catch (err) {
        console.error('Error saving local type tag:', err);
      }
    }

    // Fallbacks to prevent null foreign keys
    if (!targetTowerId) {
      const fallbackTower = towers.find((t) => !t.id.startsWith('local-'));
      targetTowerId = fallbackTower ? fallbackTower.id : towers[0]?.id;
    }
    if (!targetTypeId) {
      const fallbackType = types.find((t) => !t.id.startsWith('local-'));
      targetTypeId = fallbackType ? fallbackType.id : types[0]?.id;
    }

    const result = await onCreate({
      project_id: defaultProject.id,
      tower_id: targetTowerId,
      department_id: formData.department_id || departments[0]?.id,
      type_id: targetTypeId,
      criticality: formData.criticality,
      description: formData.description.trim(),
      current_cbe_date: formData.current_cbe_date || null,
      status_remarks: formData.status_remarks.trim() || null,
    });

    setIsSubmitting(false);
    if (result) {
      onClose();
      setFormData({
        project_id: projects[0]?.id || '',
        tower_name: '',
        department_id: departments[0]?.id || '',
        type_name: '',
        criticality: 'critical',
        description: '',
        current_cbe_date: '',
        status_remarks: '',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Log New Construction Pendency</h3>
              <p className="text-xs text-muted-foreground">Action item or decision blocking project progress</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-muted-foreground mb-1">
              Pendency Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detailed description of drawing, approval, or decision required..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-muted-foreground mb-1">Responsible Department</label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1">
                Location / Tower <span className="text-[10px] text-primary">(Text with suggestions)</span>
              </label>
              <input
                type="text"
                list="tower-suggestions"
                placeholder="Type or select location (e.g. Phase 3 Tower 10)..."
                value={formData.tower_name}
                onChange={(e) => setFormData({ ...formData, tower_name: e.target.value })}
                className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
              />
              <datalist id="tower-suggestions">
                {towers.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-muted-foreground mb-1">
                Pendency Type <span className="text-[10px] text-primary">(Text with suggestions)</span>
              </label>
              <input
                type="text"
                list="type-suggestions"
                placeholder="Type or select type (e.g. Drawing approval)..."
                value={formData.type_name}
                onChange={(e) => setFormData({ ...formData, type_name: e.target.value })}
                className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
              />
              <datalist id="type-suggestions">
                {types.map((tp) => (
                  <option key={tp.id} value={tp.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1">Criticality Level</label>
              <select
                value={formData.criticality}
                onChange={(e) => setFormData({ ...formData, criticality: e.target.value as Criticality })}
                className="w-full p-2 rounded-lg border border-input bg-background text-foreground font-medium"
              >
                <option value="critical">Critical</option>
                <option value="non_critical">Non-Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-muted-foreground mb-1">Target CBE Date (Optional)</label>
              <input
                type="date"
                value={formData.current_cbe_date}
                onChange={(e) => setFormData({ ...formData, current_cbe_date: e.target.value })}
                className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block font-medium text-muted-foreground mb-1">Logged By</label>
              <input
                type="text"
                disabled
                value={userName}
                className="w-full p-2 rounded-lg border border-input bg-muted text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-muted-foreground mb-1">Initial Status Remarks</label>
            <input
              type="text"
              placeholder="e.g. Under review with design lead..."
              value={formData.status_remarks}
              onChange={(e) => setFormData({ ...formData, status_remarks: e.target.value })}
              className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover shadow-2xs transition-colors"
            >
              <Check className="w-4 h-4" /> Create Pendency
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
