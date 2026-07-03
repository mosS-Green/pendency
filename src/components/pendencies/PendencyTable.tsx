'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  ChevronDown,
  ChevronUp,
  History,
  CheckCircle2,
} from 'lucide-react';
import { PendencyDashboardView, Department, Tower, PendencyType, PendencyFilters } from '@/lib/types';
import { InlineDatePicker, InlineStatusToggle, InlineTextEditor } from './InlineEditor';
import { FilterBar } from './FilterBar';
import { BulkActions } from './BulkActions';
import { exportPendenciesToExcel } from '@/lib/exportExcel';

interface Props {
  data: PendencyDashboardView[];
  loading: boolean;
  departments: Department[];
  towers: Tower[];
  projects: any[];
  types: PendencyType[];
  userName: string;
  onUpdateCBE: (id: string, date: string | null) => Promise<boolean>;
  onUpdateStatus: (id: string, status: 'open' | 'closed') => Promise<boolean>;
  onUpdateRemarks: (id: string, remarks: string) => Promise<boolean>;
  onSelectPendency: (item: PendencyDashboardView) => void;
  onRefreshNeeded: () => void;
  initialSearch?: string;
  initialStatus?: 'all' | 'open' | 'closed';
}

export function PendencyTable({
  data,
  loading,
  departments,
  towers,
  projects,
  types,
  userName,
  onUpdateCBE,
  onUpdateStatus,
  onUpdateRemarks,
  onSelectPendency,
  onRefreshNeeded,
  initialSearch = '',
  initialStatus = 'open',
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'human_readable_id', desc: true }]);
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});

  const [filters, setFilters] = useState<PendencyFilters>({
    search: initialSearch,
    department_ids: [],
    tower_ids: [],
    project_id: null,
    criticality: 'all',
    status: initialStatus,
    on_track_status: 'all',
    type_ids: [],
    date_from: null,
    date_to: null,
  });

  // Filter logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Global Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesRemarks = (item.status_remarks || '').toLowerCase().includes(query);
        const matchesId = item.human_readable_id.toString().includes(query);
        if (!matchesDesc && !matchesRemarks && !matchesId) return false;
      }
      // Criticality
      if (filters.criticality !== 'all' && item.criticality !== filters.criticality) return false;
      // Status
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      // On Track Status
      if (filters.on_track_status !== 'all' && item.on_track_status !== filters.on_track_status) return false;
      // Department
      if (filters.department_ids.length > 0 && !filters.department_ids.includes(item.department_id)) return false;
      // Tower
      if (filters.tower_ids.length > 0 && !filters.tower_ids.includes(item.tower_id)) return false;
      // Type
      if (filters.type_ids.length > 0 && !filters.type_ids.includes(item.type_id)) return false;

      return true;
    });
  }, [data, filters]);

  // Columns definition
  const columns = useMemo<ColumnDef<PendencyDashboardView>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="rounded border-input text-primary focus:ring-primary"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-input text-primary focus:ring-primary"
          />
        ),
        size: 36,
      },
      {
        accessorKey: 'human_readable_id',
        header: 'ID',
        cell: ({ row }) => <span className="font-mono font-bold text-foreground">#{row.original.human_readable_id}</span>,
        size: 70,
      },
      {
        accessorKey: 'criticality',
        header: 'Crit',
        cell: ({ row }) => {
          const isCrit = row.original.criticality === 'critical';
          return (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isCrit
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                  : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800'
              }`}
            >
              {isCrit ? 'CRIT' : 'NORM'}
            </span>
          );
        },
        size: 70,
      },
      {
        accessorKey: 'department_name',
        header: 'Dept',
        cell: ({ row }) => (
          <span className="font-semibold text-foreground px-2 py-0.5 rounded bg-muted/80 text-[11px] truncate">
            {row.original.department_name}
          </span>
        ),
        size: 110,
      },
      {
        accessorKey: 'tower_name',
        header: 'Tower',
        cell: ({ row }) => <span className="text-muted-foreground truncate">{row.original.tower_name}</span>,
        size: 90,
      },
      {
        accessorKey: 'type_name',
        header: 'Type',
        cell: ({ row }) => <span className="text-muted-foreground truncate">{row.original.type_name}</span>,
        size: 130,
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="font-medium text-foreground truncate max-w-md" title={row.original.description}>
            {row.original.description}
          </div>
        ),
        size: 320,
      },
      {
        accessorKey: 'current_cbe_date',
        header: 'CBE Date',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <InlineDatePicker
              value={row.original.current_cbe_date}
              onSave={(newDate) => onUpdateCBE(row.original.id, newDate)}
            />
          </div>
        ),
        size: 135,
      },
      {
        accessorKey: 'on_track_status',
        header: 'Delivery State',
        cell: ({ row }) => {
          const st = row.original.on_track_status;
          let color = 'bg-slate-500/10 text-slate-700 dark:text-slate-400';
          if (st === 'On Track') color = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold';
          if (st === 'Delayed') color = 'bg-rose-500/15 text-rose-700 dark:text-rose-400 font-semibold animate-pulse';
          if (st === 'Awaiting CBE') color = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold';

          return (
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-md text-[11px] ${color}`}>{st}</span>
              {row.original.cbe_change_count > 0 && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] text-rose-600 dark:text-rose-400 font-mono font-bold bg-rose-500/10 px-1 py-0.5 rounded"
                  title={`${row.original.cbe_change_count} CBE date shift(s)`}
                >
                  <History className="w-3 h-3" /> {row.original.cbe_change_count}x
                </span>
              )}
            </div>
          );
        },
        size: 140,
      },
      {
        accessorKey: 'days_open',
        header: 'Days Open',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.days_open}d</span>
        ),
        size: 85,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <InlineStatusToggle
              status={row.original.status}
              onToggle={(newStatus) => onUpdateStatus(row.original.id, newStatus)}
            />
          </div>
        ),
        size: 90,
      },
      {
        accessorKey: 'status_remarks',
        header: 'Current Remarks',
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()} className="w-full">
            <InlineTextEditor
              value={row.original.status_remarks}
              onSave={(newRemarks) => onUpdateRemarks(row.original.id, newRemarks)}
            />
          </div>
        ),
        size: 220,
      },
    ],
    [onUpdateCBE, onUpdateStatus, onUpdateRemarks]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      rowSelection: selectedRowIds,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setSelectedRowIds,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
  });

  const selectedList = Object.keys(selectedRowIds).filter((id) => selectedRowIds[id]);

  const handleExportAllFiltered = () => {
    exportPendenciesToExcel(filteredData, 'Woods_Pendency_List.xlsx');
  };

  const handleExportSelected = () => {
    const selectedData = filteredData.filter((d) => selectedRowIds[d.id]);
    exportPendenciesToExcel(selectedData, 'Woods_Selected_Pendencies.xlsx');
  };

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onChangeFilters={setFilters}
        departments={departments}
        towers={towers}
        projects={projects}
        types={types}
        userName={userName}
        onExportExcel={handleExportAllFiltered}
        onRefreshNeeded={onRefreshNeeded}
        totalCount={data.length}
        filteredCount={filteredData.length}
      />

      {/* Main Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground text-xs animate-pulse">
            Loading construction pendency table...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 opacity-60" />
            <p className="font-semibold text-foreground">No pendencies match your current filter</p>
            <p className="text-xs">Adjust search keywords, department filters, or status toggles above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/80 border-b border-border text-muted-foreground font-semibold sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="px-3 py-2.5 uppercase tracking-wider select-none font-mono text-[10px]"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={`flex items-center gap-1 ${
                              header.column.getCanSort() ? 'cursor-pointer hover:text-foreground' : ''
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getIsSorted() === 'asc' && <ChevronUp className="w-3 h-3 text-primary" />}
                            {header.column.getIsSorted() === 'desc' && <ChevronDown className="w-3 h-3 text-primary" />}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border/60">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onSelectPendency(row.original)}
                    className={`hover:bg-muted/50 transition-colors cursor-pointer ${
                      row.original.is_overdue ? 'bg-rose-500/5 hover:bg-rose-500/10' : ''
                    } ${row.getIsSelected() ? 'bg-primary/10' : ''}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      <BulkActions
        selectedIds={selectedList}
        onClearSelection={() => setSelectedRowIds({})}
        departments={departments}
        userName={userName}
        onRefreshNeeded={onRefreshNeeded}
        onExportSelected={handleExportSelected}
      />
    </div>
  );
}
