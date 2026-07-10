'use client';

import React from 'react';
import { PendencyDashboardView, OnTrackStatus } from '@/lib/types';
import { Calendar, AlertCircle, Clock, CheckCircle2, History } from 'lucide-react';

interface Props {
  data: PendencyDashboardView[];
  onSelectItem: (item: PendencyDashboardView) => void;
  onUpdateStatus: (id: string, status: 'open' | 'closed') => void;
}

export function KanbanBoard({ data, onSelectItem, onToggleStatus }: Props) {
  const columns: { title: OnTrackStatus; items: PendencyDashboardView[]; colorClass: string }[] = [
    {
      title: 'Awaiting CBE',
      items: data.filter((d) => d.on_track_status === 'Awaiting CBE'),
      colorClass: 'border-amber-500/40 bg-amber-500/5',
    },
    {
      title: 'On Track',
      items: data.filter((d) => d.on_track_status === 'On Track'),
      colorClass: 'border-emerald-500/40 bg-emerald-500/5',
    },
    {
      title: 'Delayed',
      items: data.filter((d) => d.on_track_status === 'Delayed'),
      colorClass: 'border-rose-500/40 bg-rose-500/5',
    },
    {
      title: 'Closed',
      items: data.filter((d) => d.on_track_status === 'Closed'),
      colorClass: 'border-slate-500/40 bg-slate-500/5',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.title} className={`rounded-xl border ${col.colorClass} p-3 space-y-3 min-w-[260px]`}>
          <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-semibold">
            <span className="text-foreground uppercase tracking-wider">{col.title}</span>
            <span className="font-mono bg-card px-2 py-0.5 rounded border border-border text-primary font-bold">
              {col.items.length}
            </span>
          </div>

          <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
            {col.items.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground italic">No items</div>
            ) : (
              col.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className="rounded-lg border border-border bg-card p-3 shadow-2xs space-y-2 hover:border-primary/50 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground truncate max-w-[120px] bg-muted px-1.5 py-0.5 rounded text-[11px]">
                      {item.department_name}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        item.criticality === 'critical'
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                          : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {item.criticality.replace('_', '-')}
                    </span>
                  </div>

                  <p className="font-medium text-foreground line-clamp-2 leading-snug">{item.description}</p>

                  {item.status_remarks && (
                    <p className="text-[11px] text-red-600 dark:text-red-500 font-bold leading-relaxed break-words">
                      {item.status_remarks}
                    </p>
                  )}

                  <div className="flex items-center justify-end text-[11px] text-muted-foreground pt-1 border-t border-border/60">
                    <div className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{item.current_cbe_date || 'Awaiting'}</span>
                    </div>
                  </div>

                  {item.cbe_change_count > 0 && (
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono font-semibold flex items-center gap-1">
                      <History className="w-3 h-3" /> {item.cbe_change_count} CBE date shift(s)
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
