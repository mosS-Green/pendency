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
  Building,
  User,
  Clock,
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
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'comments' | 'attachments'>('details');
  const [formData, setFormData] = useState<Partial<PendencyDashboardView>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Hook for comments & attachments
  const { comments, addComment } = useComments(pendency?.id || null);
  const { attachments, uploading, uploadAttachment } = useAttachments(pendency?.id || null);

  const [newCommentText, setNewCommentText] = useState('');

  useEffect(() => {
    if (pendency) {
      setFormData(pendency);
    }
  }, [pendency]);

  if (!pendency) return null;

  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const { error } = await supabase
      .from('pendencies')
      .update({
        department_id: formData.department_id,
        tower_id: formData.tower_id,
        type_id: formData.type_id,
        criticality: formData.criticality,
        status: formData.status,
        description: formData.description,
        current_cbe_date: formData.current_cbe_date || null,
        status_remarks: formData.status_remarks || null,
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
              #{pendency.human_readable_id}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                pendency.criticality === 'critical'
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                  : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
              }`}
            >
              {pendency.criticality.replace('_', '-')}
            </span>
          </div>

          <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-border bg-background px-4 text-xs font-medium">
          {(['details', 'timeline', 'comments', 'attachments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-3 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'timeline' ? `CBE History (${pendency.cbe_change_count})` : tab}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {activeTab === 'details' && (
            <form onSubmit={handleSaveFullEdit} className="space-y-4">
              <div>
                <label className="block font-medium text-muted-foreground mb-1">Pendency Description</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Department</label>
                  <select
                    value={formData.department_id || ''}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Tower</label>
                  <select
                    value={formData.tower_id || ''}
                    onChange={(e) => setFormData({ ...formData, tower_id: e.target.value })}
                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
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
                  <label className="block font-medium text-muted-foreground mb-1">Pendency Type</label>
                  <select
                    value={formData.type_id || ''}
                    onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  >
                    {types.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Criticality</label>
                  <select
                    value={formData.criticality || 'critical'}
                    onChange={(e) => setFormData({ ...formData, criticality: e.target.value as any })}
                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  >
                    <option value="critical">Critical</option>
                    <option value="non_critical">Non-Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Current CBE Date</label>
                  <input
                    type="date"
                    value={formData.current_cbe_date || ''}
                    onChange={(e) => setFormData({ ...formData, current_cbe_date: e.target.value || null })}
                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block font-medium text-muted-foreground mb-1">Status</label>
                  <select
                    value={formData.status || 'open'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  >
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-muted-foreground mb-1">Status Remarks / Next Actions</label>
                <textarea
                  rows={2}
                  value={formData.status_remarks || ''}
                  onChange={(e) => setFormData({ ...formData, status_remarks: e.target.value })}
                  className="w-full p-2 rounded-md border border-input bg-background text-foreground"
                  placeholder="Current progress notes..."
                />
              </div>

              {/* Readonly Computed Metadata Box */}
              <div className="p-3 rounded-lg bg-muted/60 border border-border space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>Days Open:</span>
                  <span className="font-medium text-foreground">{pendency.days_open} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Status:</span>
                  <span className="font-semibold text-primary">{pendency.on_track_status}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created By:</span>
                  <span>{pendency.created_by} on {new Date(pendency.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Modified By:</span>
                  <span>{pendency.updated_by} on {new Date(pendency.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover shadow-2xs transition-colors"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          )}

          {activeTab === 'timeline' && <CBETimeline pendencyId={pendency.id} />}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-2 max-h-80 overflow-y-auto">
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
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary-hover"
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
