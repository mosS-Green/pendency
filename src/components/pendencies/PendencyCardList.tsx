'use client';

import React, { useState, useMemo } from 'react';
import { PendencyDashboardView } from '@/lib/types';
import { Calendar, History, Clock, ArrowUpRight, Filter } from 'lucide-react';
import { InlineStatusToggle, InlineDatePicker } from './InlineEditor';

interface Props {
  items: PendencyDashboardView[];
  onSelectItem: (item: PendencyDashboardView) => void;
  onUpdateCBE: (id: string, date: string | null) => Promise<boolean>;
  onUpdateStatus: (id: string, status: 'open' | 'closed') => Promise<boolean>;
  initialStatus?: 'open' | 'closed' | 'all';
}

export function PendencyCardList({ items, onSelectItem, onUpdateCBE, onUpdateStatus, initialStatus = 'open' }: Props) {
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'all'>(initialStatus);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Top Quick Status Switcher */}
      <div className="flex items-center justify-between border-b border-border pb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter Cards:
          </span>
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5 font-medium">
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'open' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Open Items ({items.filter((i) => i.status === 'open').length})
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'closed' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Closed Items ({items.filter((i) => i.status === 'closed').length})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Items ({items.length})
            </button>
          </div>
        </div>

        <span className="text-[11px] text-muted-foreground font-mono">
          Showing <strong className="text-foreground">{filteredItems.length}</strong> card(s)
        </span>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-16 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
          {statusFilter === 'open' ? 'No open pendency cards found.' : 'No closed pendency cards match the criteria.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
        // Subtle color coding
        let borderClass = 'border-l-4 border-l-slate-400 dark:border-l-slate-600';
        let bgTint = 'bg-card';

        if (item.status === 'closed') {
          borderClass = 'border-l-4 border-l-slate-400 dark:border-l-slate-700 opacity-75';
          bgTint = 'bg-muted/30';
        } else if (item.on_track_status === 'Delayed') {
          borderClass = 'border-l-4 border-l-rose-500 dark:border-l-rose-600';
          bgTint = 'bg-rose-500/5';
        } else if (item.on_track_status === 'On Track') {
          borderClass = 'border-l-4 border-l-emerald-500 dark:border-l-emerald-600';
          bgTint = 'bg-emerald-500/5';
        } else if (item.on_track_status === 'Awaiting CBE') {
          borderClass = 'border-l-4 border-l-amber-500 dark:border-l-amber-600';
          bgTint = 'bg-amber-500/5';
        }

        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            className={`group relative rounded-xl border border-border ${borderClass} ${bgTint} p-4 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3`}
          >
            {/* Top Row: Department + Type Badge + Criticality */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground bg-background px-1.5 py-0.5 rounded border border-border truncate max-w-[150px]">
                  {item.department_name}
                </span>
                <span className="font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded text-[11px] truncate max-w-[120px]">
                  {item.type_name}
                </span>
              </div>

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

            {/* Pendency Description (Wrapped text as per screen width) */}
            <div className="space-y-1.5">
              <p className="font-medium text-foreground text-xs leading-relaxed break-words line-clamp-3 group-hover:text-primary transition-colors">
                {item.description}
              </p>
              {item.status_remarks && (
                <p className="text-[11px] text-red-600 dark:text-red-500 font-bold leading-relaxed break-words">
                  {item.status_remarks}
                </p>
              )}
            </div>

            {/* Card Footer: CBE Date + Age (Days Open) + Status Toggle */}
            <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
              {/* CBE Date */}
              <div onClick={(e) => e.stopPropagation()}>
                <InlineDatePicker
                  value={item.current_cbe_date}
                  onSave={(newDate) => onUpdateCBE(item.id, newDate)}
                />
              </div>

              {/* Age & Status */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" /> {item.days_open}d
                </span>
                <div onClick={(e) => e.stopPropagation()}>
                  <InlineStatusToggle
                    status={item.status}
                    onToggle={(newStatus) => onUpdateStatus(item.id, newStatus)}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
        </div>
      )}
    </div>
  );
}
