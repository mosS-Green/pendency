'use client';

import React, { useState, useMemo } from 'react';
import { PendencyDashboardView } from '@/lib/types';
import { Building2, Calendar, Clock, History, Search, X } from 'lucide-react';

interface Props {
  data: PendencyDashboardView[];
  onSelectItem: (item: PendencyDashboardView) => void;
  statusFilter?: 'open' | 'closed' | 'overdue' | 'all';
}

export function DepartmentKanban({ data, onSelectItem, statusFilter = 'open' }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items by statusFilter and search query
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Status Filter
      if (statusFilter === 'open' && item.status !== 'open') return false;
      if (statusFilter === 'closed' && item.status !== 'closed') return false;
      if (statusFilter === 'overdue' && (item.status !== 'open' || !item.is_overdue)) return false;

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchTower = (item.tower_name || '').toLowerCase().includes(q);
        const matchType = (item.type_name || '').toLowerCase().includes(q);
        const matchRemarks = (item.status_remarks || '').toLowerCase().includes(q);
        const matchId = item.human_readable_id.toString().includes(q);
        if (!matchDesc && !matchTower && !matchType && !matchRemarks && !matchId) return false;
      }

      return true;
    });
  }, [data, searchQuery, statusFilter]);

  // Department Column definitions
  const columns = [
    {
      id: 'cp',
      title: 'C&P (Contracts & Procurement)',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700/50',
      items: filteredData.filter((d) => {
        const dept = d.department_name.toLowerCase();
        return dept.includes('c&p') || dept.includes('contracts') || dept.includes('procurement');
      }),
    },
    {
      id: 'cb',
      title: 'C&B (Cost & Billing)',
      badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700/50',
      items: filteredData.filter((d) => {
        const dept = d.department_name.toLowerCase();
        return dept.includes('c&b') || dept.includes('cost') || dept.includes('billing');
      }),
    },
    {
      id: 'design',
      title: 'Design',
      badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700/50',
      items: filteredData.filter((d) => {
        const dept = d.department_name.toLowerCase();
        return dept.includes('design') || dept.includes('archi');
      }),
    },
  ];

  return (
    <div className="space-y-3">
      {/* Header + Real-Time Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-primary" /> Department Pendencies Board
          </h3>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              statusFilter === 'closed'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                : statusFilter === 'overdue'
                ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                : statusFilter === 'all'
                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800'
            }`}
          >
            {statusFilter === 'closed'
              ? 'Showing Closed Items'
              : statusFilter === 'overdue'
              ? 'Showing Overdue Items'
              : statusFilter === 'all'
              ? 'Showing All Items'
              : 'Showing Open Items Only'}
          </span>
        </div>

        {/* Dashboard Search Bar */}
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search dashboard pendencies by keyword, ID, tower..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-2">
        {columns.map((col) => (
          <div
            key={col.id}
            className="rounded-xl border border-border bg-card/60 p-3 space-y-3 min-w-[280px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between border-b border-border pb-2 text-xs font-semibold">
              <span className="text-foreground font-bold truncate max-w-[200px]" title={col.title}>
                {col.title}
              </span>
              <span className={`px-2 py-0.5 rounded border text-[11px] font-mono font-bold ${col.badgeColor}`}>
                {col.items.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[calc(100vh-22rem)] overflow-y-auto pr-1 flex-1">
              {col.items.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground italic">
                  {searchQuery ? 'No matching pendencies found.' : 'No active pendencies for this department.'}
                </div>
              ) : (
                col.items.map((item) => {
                  let borderClass = 'border-l-4 border-l-slate-400 dark:border-l-slate-600';
                  if (item.status === 'closed') borderClass = 'border-l-4 border-l-slate-400 opacity-75';
                  else if (item.on_track_status === 'Delayed') borderClass = 'border-l-4 border-l-rose-500';
                  else if (item.on_track_status === 'On Track') borderClass = 'border-l-4 border-l-emerald-500';
                  else if (item.on_track_status === 'Awaiting CBE') borderClass = 'border-l-4 border-l-amber-500';

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectItem(item)}
                      className={`rounded-xl border border-border ${borderClass} bg-background p-3 shadow-2xs hover:border-primary/50 transition-colors cursor-pointer space-y-2 text-xs`}
                    >
                      {/* Top Header */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded text-[11px]">
                            #{item.human_readable_id}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate font-medium max-w-[110px]">
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

                      {/* Description */}
                      <p className="font-medium text-foreground line-clamp-2 leading-snug">
                        {item.description}
                      </p>

                      {/* Location / Tower */}
                      <div className="text-[11px] text-muted-foreground font-medium truncate">
                        📍 {item.tower_name}
                      </div>

                      {/* Footer */}
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-mono flex items-center gap-1 text-foreground">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {item.current_cbe_date || 'Awaiting'}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.on_track_status === 'On Track'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : item.on_track_status === 'Delayed'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                              : item.on_track_status === 'Awaiting CBE'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                              : 'bg-slate-500/15 text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {item.on_track_status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
