'use client';

import React from 'react';
import { History, Calendar, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useCBEHistory } from '@/hooks/useCBEHistory';

interface Props {
  pendencyId: string;
}

export function CBETimeline({ pendencyId }: Props) {
  const { history, loading } = useCBEHistory(pendencyId);

  if (loading) {
    return <div className="text-xs text-muted-foreground py-2 animate-pulse">Loading CBE change audit log...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-3 bg-muted/50 rounded-lg p-3 text-center">
        No CBE date modifications recorded yet. (Initial date or awaiting target date).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-primary" /> CBE Slippage History Audit ({history.length})
        </h4>
      </div>

      <div className="relative border-l-2 border-primary/30 pl-4 ml-2 space-y-4">
        {history.map((item, idx) => {
          // Calculate slippage days if previous date exists
          let slipDays = 0;
          if (item.previous_cbe_date && item.new_cbe_date) {
            const prev = new Date(item.previous_cbe_date).getTime();
            const curr = new Date(item.new_cbe_date).getTime();
            slipDays = Math.round((curr - prev) / (1000 * 3600 * 24));
          }

          return (
            <div key={item.id} className="relative text-xs space-y-1">
              {/* Dot Icon */}
              <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />

              <div className="flex items-center justify-between font-mono">
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <span>{item.previous_cbe_date || 'Initial'}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-primary">{item.new_cbe_date}</span>
                </div>

                {slipDays !== 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      slipDays > 0
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {slipDays > 0 ? `+${slipDays} days slipped` : `${slipDays} days pulled ahead`}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-muted-foreground" /> {item.changed_by}
                </span>
                <span>{new Date(item.changed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>

              {item.reason && (
                <p className="text-[11px] text-foreground bg-muted p-2 rounded border border-border italic mt-1">
                  "{item.reason}"
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
