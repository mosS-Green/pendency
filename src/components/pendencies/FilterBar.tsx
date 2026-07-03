'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, RotateCcw, Bookmark, Save, X, Download, Upload } from 'lucide-react';
import { Department, Tower, Project, PendencyType, PendencyFilters, Criticality, PendencyStatus, OnTrackStatus } from '@/lib/types';
import { importPendenciesFromExcel } from '@/lib/exportExcel';

interface Props {
  filters: PendencyFilters;
  onChangeFilters: (newFilters: PendencyFilters) => void;
  departments: Department[];
  towers: Tower[];
  projects: Project[];
  types: PendencyType[];
  userName: string;
  onExportExcel: () => void;
  onRefreshNeeded: () => void;
  totalCount: number;
  filteredCount: number;
}

const SAVED_VIEWS_KEY = 'pendency_tracker_saved_views';

export function FilterBar({
  filters,
  onChangeFilters,
  departments,
  towers,
  projects,
  types,
  userName,
  onExportExcel,
  onRefreshNeeded,
  totalCount,
  filteredCount,
}: Props) {
  const [savedViews, setSavedViews] = useState<{ name: string; filters: PendencyFilters }[]>([]);
  const [viewNameInput, setViewNameInput] = useState('');
  const [isSavingView, setIsSavingView] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_VIEWS_KEY);
      if (stored) setSavedViews(JSON.parse(stored));
    } catch {}
  }, []);

  const handleSaveCurrentView = () => {
    if (!viewNameInput.trim()) return;
    const updated = [...savedViews, { name: viewNameInput.trim(), filters }];
    setSavedViews(updated);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updated));
    setViewNameInput('');
    setIsSavingView(false);
  };

  const handleLoadSavedView = (saved: PendencyFilters) => {
    onChangeFilters(saved);
  };

  const handleRemoveSavedView = (index: number) => {
    const updated = savedViews.filter((_, i) => i !== index);
    setSavedViews(updated);
    localStorage.setItem(SAVED_VIEWS_KEY, JSON.stringify(updated));
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsImporting(true);

    const result = await importPendenciesFromExcel(file, userName, departments, towers, projects, types);

    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (result.successCount > 0) {
      alert(`Successfully imported ${result.successCount} pendency items!`);
      onRefreshNeeded();
    } else {
      alert(`Import failed or no valid rows found.`);
    }
  };

  const resetFilters = () => {
    onChangeFilters({
      search: '',
      department_ids: [],
      tower_ids: [],
      project_id: null,
      criticality: 'all',
      status: 'all',
      on_track_status: 'all',
      type_ids: [],
      date_from: null,
      date_to: null,
    });
  };

  const isFiltered =
    filters.search ||
    filters.department_ids.length > 0 ||
    filters.tower_ids.length > 0 ||
    filters.criticality !== 'all' ||
    filters.status !== 'all' ||
    filters.on_track_status !== 'all' ||
    filters.type_ids.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-2xs space-y-3">
      {/* Top Row: Search + Quick Toggles + Export / Import */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by description, remarks, or ID..."
            value={filters.search}
            onChange={(e) => onChangeFilters({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Quick Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Criticality */}
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs font-medium">
            {(['all', 'critical', 'non_critical'] as const).map((crit) => (
              <button
                key={crit}
                onClick={() => onChangeFilters({ ...filters, criticality: crit })}
                className={`px-2.5 py-1 rounded-md transition-colors capitalize ${
                  filters.criticality === crit
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {crit === 'non_critical' ? 'Non-Critical' : crit}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs font-medium">
            {(['all', 'open', 'closed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => onChangeFilters({ ...filters, status: st })}
                className={`px-2.5 py-1 rounded-md transition-colors capitalize ${
                  filters.status === st
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Import XLSX */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors shadow-2xs"
            title="Import pendencies from XLSX spreadsheet"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>{isImporting ? 'Importing...' : 'Import XLSX'}</span>
          </button>

          {/* Export XLSX */}
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-2xs"
            title="Export current view to XLSX"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export XLSX</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Detailed Dropdowns & Saved Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 font-medium text-muted-foreground">
            <Filter className="w-3.5 h-3.5" /> Filter by:
          </span>

          {/* Department Dropdown */}
          <select
            value={filters.department_ids[0] || ''}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                department_ids: e.target.value ? [e.target.value] : [],
              })
            }
            className="px-2 py-1 rounded border border-input bg-background text-foreground focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Tower Dropdown */}
          <select
            value={filters.tower_ids[0] || ''}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                tower_ids: e.target.value ? [e.target.value] : [],
              })
            }
            className="px-2 py-1 rounded border border-input bg-background text-foreground focus:outline-none"
          >
            <option value="">All Towers</option>
            {towers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Type Dropdown */}
          <select
            value={filters.type_ids[0] || ''}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                type_ids: e.target.value ? [e.target.value] : [],
              })
            }
            className="px-2 py-1 rounded border border-input bg-background text-foreground focus:outline-none"
          >
            <option value="">All Pendency Types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* On Track Status */}
          <select
            value={filters.on_track_status}
            onChange={(e) =>
              onChangeFilters({
                ...filters,
                on_track_status: e.target.value as OnTrackStatus | 'all',
              })
            }
            className="px-2 py-1 rounded border border-input bg-background text-foreground focus:outline-none"
          >
            <option value="all">All Delivery States</option>
            <option value="Awaiting CBE">Awaiting CBE</option>
            <option value="On Track">On Track</option>
            <option value="Delayed">Delayed</option>
            <option value="Closed">Closed</option>
          </select>

          {isFiltered && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* Count Indicator & Save View */}
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground font-mono text-[11px]">
            Showing <strong className="text-foreground">{filteredCount}</strong> of {totalCount} items
          </span>

          {/* Saved Views Dropdown/Chips */}
          {savedViews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-primary" />
              {savedViews.map((sv, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-foreground border border-border text-[11px]"
                >
                  <button onClick={() => handleLoadSavedView(sv.filters)} className="hover:underline">
                    {sv.name}
                  </button>
                  <button onClick={() => handleRemoveSavedView(idx)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {isSavingView ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="View name..."
                value={viewNameInput}
                onChange={(e) => setViewNameInput(e.target.value)}
                className="px-1.5 py-0.5 text-xs rounded border border-primary bg-background"
                autoFocus
              />
              <button
                onClick={handleSaveCurrentView}
                className="p-1 rounded bg-primary text-primary-foreground"
              >
                <Save className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSavingView(true)}
              className="text-muted-foreground hover:text-foreground text-[11px] font-medium underline"
            >
              Save View
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
