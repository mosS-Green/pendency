'use client';

import React, { useState } from 'react';
import { CheckSquare, CheckCircle, ArrowRightLeft, Download, X } from 'lucide-react';
import { Department } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface Props {
  selectedIds: string[];
  onClearSelection: () => void;
  departments: Department[];
  userName: string;
  onRefreshNeeded: () => void;
  onExportSelected: () => void;
}

export function BulkActions({
  selectedIds,
  onClearSelection,
  departments,
  userName,
  onRefreshNeeded,
  onExportSelected,
}: Props) {
  const [targetDeptId, setTargetDeptId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleBulkClose = async () => {
    setIsUpdating(true);
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase
      .from('pendencies')
      .update({
        status: 'closed',
        closed_on: today,
        updated_by: userName,
        updated_at: new Date().toISOString(),
      })
      .in('id', selectedIds);

    setIsUpdating(false);
    if (!error) {
      onClearSelection();
      onRefreshNeeded();
    }
  };

  const handleBulkReassign = async () => {
    if (!targetDeptId) return;
    setIsUpdating(true);

    const { error } = await supabase
      .from('pendencies')
      .update({
        department_id: targetDeptId,
        updated_by: userName,
        updated_at: new Date().toISOString(),
      })
      .in('id', selectedIds);

    setIsUpdating(false);
    if (!error) {
      onClearSelection();
      onRefreshNeeded();
      setTargetDeptId('');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-card shadow-2xl text-xs animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 font-medium text-foreground pr-2 border-r border-border">
        <CheckSquare className="w-4 h-4 text-primary" />
        <span>
          <strong className="text-primary">{selectedIds.length}</strong> items selected
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Bulk Close */}
        <button
          onClick={handleBulkClose}
          disabled={isUpdating}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" /> Bulk Close
        </button>

        {/* Bulk Reassign */}
        <div className="flex items-center gap-1">
          <select
            value={targetDeptId}
            onChange={(e) => setTargetDeptId(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-input bg-background text-foreground focus:outline-none"
          >
            <option value="">Reassign Dept...</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleBulkReassign}
            disabled={!targetDeptId || isUpdating}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-medium disabled:opacity-50 transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Move
          </button>
        </div>

        {/* Bulk Export */}
        <button
          onClick={onExportSelected}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-muted font-medium transition-colors border border-border"
        >
          <Download className="w-3.5 h-3.5" /> Export Selected
        </button>

        {/* Cancel Selection */}
        <button
          onClick={onClearSelection}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted ml-1"
          title="Deselect all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
