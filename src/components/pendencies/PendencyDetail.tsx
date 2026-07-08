'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Calendar,
  MessageSquare,
  Paperclip,
  History,
  AlertTriangle,
  Send,
  UploadCloud,
  FileText,
  User,
  Clock,
  Layers,
  Building,
} from 'lucide-react';
import { PendencyDashboardView, Department, Tower, PendencyType } from '@/lib/types';
import { CBETimeline } from './CBETimeline';
import { useComments } from '@/hooks/useComments';
import { useAttachments } from '@/hooks/useAttachments';
import { supabase } from '@/lib/supabase';

interface Props {
  pendency: PendencyDashboardView | null;
  onClose: () => void;
  departments: Department[];
  towers: Tower[];
  types: PendencyType[];
  userName: string;
  onSaved: () => void;
}

export function PendencyDetail({
  pendency,
  onClose,
  departments,
  towers,
  types,
  userName,
  onSaved,
}: Props) {
  const [activeTab, setActiveTab] = useState<'form' | 'timeline' | 'comments' | 'attachments'>('form');
  const [formData, setFormData] = useState<Partial<PendencyDashboardView>>({});
  const [towerInput, setTowerInput] = useState('');
  const [typeInput, setTypeInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { comments, addComment } = useComments(pendency?.id || null);
  const { attachments, uploading, uploadAttachment } = useAttachments(pendency?.id || null);
  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    if (pendency) {
      setFormData(pendency);
      setTowerInput(pendency.tower_name || '');
      setTypeInput(pendency.type_name || '');
    }
  }, [pendency]);

  if (!pendency) return null;

  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Resolve or Auto-create Tower
    let targetTowerId = formData.tower_id;
    if (towerInput.trim() && towerInput.trim().toLowerCase() !== (pendency.tower_name || '').toLowerCase()) {
      const matched = towers.find((t) => t.name.toLowerCase() === towerInput.trim().toLowerCase());
      if (matched) {
        targetTowerId = matched.id;
      } else {
        const { data: newTower } = await supabase
          .from('towers')
          .insert({ project_id: pendency.project_id, name: towerInput.trim() })
          .select()
          .single();
        if (newTower) targetTowerId = newTower.id;
      }
    }

    // Resolve or Auto-create Type
    let targetTypeId = formData.type_id;
    if (typeInput.trim() && typeInput.trim().toLowerCase() !== (pendency.type_name || '').toLowerCase()) {
      const matched = types.find((tp) => tp.name.toLowerCase() === typeInput.trim().toLowerCase());
      if (matched) {
        targetTypeId = matched.id;
      } else {
        const { data: newType } = await supabase
          .from('pendency_types')
          .insert({ name: typeInput.trim() })
          .select()
          .single();
        if (newType) targetTypeId = newType.id;
      }
    }

    const closedOn = formData.status === 'closed' ? (formData.closed_on || new Date().toISOString().split('T')[0]) : null;

    const { error } = await supabase
      .from('pendencies')
      .update({
        department_id: formData.department_id,
        tower_id: targetTowerId,
        type_id: targetTypeId,
        criticality: formData.criticality,
        status: formData.status,
        description: formData.description,
        current_cbe_date: formData.current_cbe_date || null,
        status_remarks: formData.status_remarks || null,
        closed_on: closedOn,
        updated_by: userName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendency.id);

    setIsSaving(false);
    if (!error) {
      onSaved();
      onClose();
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const success = await addComment(userName, newCommentText);
    if (success) setNewCommentText('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadAttachment(e.target.files[0], userName);
    }
  };

  const isClosed = formData.status === 'closed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl flex flex-col my-auto max-h-[92vh] overflow-hidden">
        {/* Floating Window Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/20">
              #{pendency.human_readable_id}
            </span>
            <div className="flex flex-col">
              <h3 className="font-bold text-sm text-foreground truncate max-w-sm">
                {pendency.description}
              </h3>
              <span className="text-[11px] text-muted-foreground">
                {pendency.department_name} • {towerInput || pendency.tower_name}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-background px-5 text-xs font-medium shrink-0">
          {(['form', 'timeline', 'comments', 'attachments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2.5 px-3.5 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'form'
                ? 'Item Form Details'
                : tab === 'timeline'
                ? `CBE Shifts (${pendency.cbe_change_count})`
                : tab === 'comments'
                ? `Comments (${comments.length})`
                : `Attachments (${attachments.length})`}
            </button>
          ))}
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'form' && (
            <form onSubmit={handleSaveFullEdit} className="space-y-4">
              {/* Status Switch & Calculated Badges Banner */}
              <div className="p-3 rounded-lg border border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3">
                {/* Open/Closed Toggle Switch */}
                <div className="flex items-center gap-3">
                  <span className="font-medium text-foreground text-xs">Status:</span>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isClosed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.checked ? 'closed' : 'open',
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-amber-500/30 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-700 dark:peer-checked:bg-slate-600"></div>
                    <span className="ml-2 font-bold uppercase tracking-wider text-[11px]">
                      {isClosed ? (
                        <span className="text-slate-600 dark:text-slate-400">Closed</span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Open</span>
                      )}
                    </span>
                  </label>
                </div>

                {/* Calculated Non-Editable Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-1 rounded bg-background border border-border text-[11px] font-mono">
                    Age: <strong>{pendency.days_open}d</strong>
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded font-semibold text-[11px] ${
                      pendency.on_track_status === 'On Track'
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                        : pendency.on_track_status === 'Delayed'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                        : pendency.on_track_status === 'Awaiting CBE'
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        : 'bg-slate-500/15 text-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {pendency.on_track_status}
                  </span>
                </div>
              </div>

              {/* Editable Description */}
              <div>
                <label className="block font-medium text-muted-foreground mb-1">
                  Pendency Details / Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-medium"
                  required
                />
              </div>

              {/* Form Grid: Dept, Tower, Type, Criticality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Department</label>
                  <select
                    value={formData.department_id || ''}
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
                    list="edit-tower-suggestions"
                    placeholder="Location / Tower name..."
                    value={towerInput}
                    onChange={(e) => setTowerInput(e.target.value)}
                    className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
                  />
                  <datalist id="edit-tower-suggestions">
                    {towers.map((t) => (
                      <option key={t.id} value={t.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">
                    Pendency Type <span className="text-[10px] text-primary">(Text with suggestions)</span>
                  </label>
                  <input
                    type="text"
                    list="edit-type-suggestions"
                    placeholder="Pendency type..."
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value)}
                    className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
                  />
                  <datalist id="edit-type-suggestions">
                    {types.map((tp) => (
                      <option key={tp.id} value={tp.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Criticality</label>
                  <select
                    value={formData.criticality || 'critical'}
                    onChange={(e) => setFormData({ ...formData, criticality: e.target.value as any })}
                    className="w-full p-2 rounded-lg border border-input bg-background text-foreground font-semibold"
                  >
                    <option value="critical">Critical</option>
                    <option value="non_critical">Non-Critical</option>
                  </select>
                </div>
              </div>

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Current Target CBE Date</label>
                  <input
                    type="date"
                    value={formData.current_cbe_date || ''}
                    onChange={(e) => setFormData({ ...formData, current_cbe_date: e.target.value || null })}
                    className="w-full p-2 rounded-lg border border-input bg-background text-foreground font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Date Opened</label>
                  <input
                    type="date"
                    value={formData.opened_on || ''}
                    onChange={(e) => setFormData({ ...formData, opened_on: e.target.value })}
                    className="w-full p-2 rounded-lg border border-input bg-background text-foreground font-mono"
                  />
                </div>
              </div>

              {/* Current Status / Remarks Field at the Bottom */}
              <div className="pt-2 border-t border-border">
                <label className="block font-semibold text-foreground mb-1">
                  Current Status / Action Remarks
                </label>
                <textarea
                  rows={3}
                  value={formData.status_remarks || ''}
                  onChange={(e) => setFormData({ ...formData, status_remarks: e.target.value })}
                  placeholder="Enter latest action notes, vendor discussions, or approval status..."
                  className="w-full p-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Save Footer */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover shadow-xs transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Form Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === 'timeline' && <CBETimeline pendencyId={pendency.id} />}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No comments posted yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="p-3 rounded-lg border border-border bg-background space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <User className="w-3 h-3" /> {c.author}
                        </span>
                        <span>{new Date(c.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{c.body}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handlePostComment} className="flex gap-2 border-t border-border pt-3">
                <input
                  type="text"
                  placeholder="Write a comment or activity note..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 text-center space-y-2">
                <UploadCloud className="w-6 h-6 mx-auto text-primary" />
                <p className="font-medium text-foreground">Upload Approval Doc / Drawing</p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary-hover cursor-pointer"
                />
                {uploading && <p className="text-xs text-primary animate-pulse">Uploading file to Supabase...</p>}
              </div>

              <div className="space-y-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <a href={att.file_url} target="_blank" rel="noreferrer" className="font-medium text-foreground hover:underline truncate">
                        {att.file_name}
                      </a>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">{att.uploaded_by}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
