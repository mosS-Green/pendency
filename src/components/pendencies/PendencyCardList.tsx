'use client';

import React from 'react';
import { PendencyDashboardView } from '@/lib/types';
import { Calendar, History, Clock, ArrowUpRight } from 'lucide-react';
import { InlineStatusToggle, InlineDatePicker } from './InlineEditor';

interface Props {
  items: PendencyDashboardView[];
  onSelectItem: (item: PendencyDashboardView) => void;
  onUpdateCBE: (id: string, date: string | null) => Promise<boolean>;
  onUpdateStatus: (id: string, status: 'open' | 'closed') => Promise<boolean>;
}

export function PendencyCardList({ items, onSelectItem, onUpdateCBE, onUpdateStatus }: Props) {
  if (items.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
        No pendency cards match the selected filter criteria.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => {
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
            {/* Top Row: ID + Type Badge + Criticality */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                  #{item.human_readable_id}
                </span>
                <span className="font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded text-[11px] truncate max-w-[120px]">
                  {item.type_name}
                </span>
              </div>

              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                  item.criticality === 'critical'
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                    : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                }`}
              >
                {item.criticality.replace('_', '-')}
              </span>
            </div>

            {/* Pendency Description (Wrapped text as per screen width) */}
            <div className="space-y-1">
              <p className="font-medium text-foreground text-xs leading-relaxed break-words line-clamp-3 group-hover:text-primary transition-colors">
                {item.description}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {item.department_name} • {item.tower_name}
              </p>
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
  );
}
