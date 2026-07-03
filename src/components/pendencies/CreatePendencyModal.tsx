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
    tower_id: towers[0]?.id || '',
    department_id: departments[0]?.id || '',
    type_id: types[0]?.id || '',
    criticality: 'critical' as Criticality,
    description: '',
    current_cbe_date: '',
    status_remarks: '',
  });

  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [localTypes, setLocalTypes] = useState<PendencyType[]>(types);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync types prop
  React.useEffect(() => {
    setLocalTypes(types);
  }, [types]);

  if (!isOpen) return null;

  const handleAddNewTypeInline = async () => {
    if (!newTypeName.trim()) return;
    const { data, error } = await supabase
      .from('pendency_types')
      .insert({ name: newTypeName.trim() })
      .select()
      .single();

    if (!error && data) {
      setLocalTypes((prev) => [...prev, data as PendencyType]);
      setFormData((prev) => ({ ...prev, type_id: data.id }));
      setNewTypeName('');
      setIsAddingNewType(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) return;

    setIsSubmitting(true);
    const result = await onCreate({
      project_id: formData.project_id || projects[0]?.id,
      tower_id: formData.tower_id || towers[0]?.id,
      department_id: formData.department_id || departments[0]?.id,
      type_id: formData.type_id || localTypes[0]?.id,
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
        tower_id: towers[0]?.id || '',
        department_id: departments[0]?.id || '',
        type_id: localTypes[0]?.id || '',
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
              <label className="block font-medium text-muted-foreground mb-1">Tower / Location</label>
              <select
                value={formData.tower_id}
                onChange={(e) => setFormData({ ...formData, tower_id: e.target.value })}
                className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
              >
                {towers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-medium text-muted-foreground">Pendency Type</label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewType(!isAddingNewType)}
                  className="text-[10px] text-primary hover:underline font-semibold"
                >
                  {isAddingNewType ? 'Cancel' : '+ New Type'}
                </button>
              </div>

              {isAddingNewType ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Type name..."
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="w-full p-1.5 text-xs rounded border border-primary bg-background"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddNewTypeInline}
                    className="p-1.5 rounded bg-primary text-primary-foreground font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <select
                  value={formData.type_id}
                  onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                  className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
                >
                  {localTypes.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.name}
                    </option>
                  ))}
                </select>
              )}
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
