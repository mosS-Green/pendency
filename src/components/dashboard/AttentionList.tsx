'use client';

import React from 'react';
import { AlertTriangle, ChevronRight, Clock } from 'lucide-react';
import { PendencyDashboardView } from '@/lib/types';

interface Props {
  overdueItems: PendencyDashboardView[];
  onSelectItem: (item: PendencyDashboardView) => void;
}

export function AttentionList({ overdueItems, onSelectItem }: Props) {
  const sorted = [...overdueItems].sort((a, b) => (b.days_since_cbe_due || 0) - (a.days_since_cbe_due || 0)).slice(0, 5);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" /> Urgent Attention Needed ({overdueItems.length} Overdue)
        </h3>
        <span className="text-[11px] text-muted-foreground font-mono">Sorted by Delay</span>
      </div>

      {sorted.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          No overdue pendency items! All active commitments are on track.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="group flex items-center justify-between p-2.5 rounded-lg border border-border bg-background hover:bg-muted/60 transition-colors cursor-pointer text-xs"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                  #{item.human_readable_id}
                </span>
                <div className="truncate">
                  <p className="font-medium text-foreground truncate">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.department_name} • {item.tower_name} • Target CBE: {item.current_cbe_date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded text-[11px]">
                  +{item.days_since_cbe_due}d Overdue
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
