'use client';

import React, { useState, useMemo, use } from 'react';
import { DEPARTMENT_SLUGS } from '@/lib/departmentSlugs';
import { usePendencies } from '@/hooks/usePendencies';
import { useUserName } from '@/hooks/useUserName';
import { PendencyTable } from '@/components/pendencies/PendencyTable';
import { KanbanBoard } from '@/components/pendencies/KanbanBoard';
import { PendencyDetail } from '@/components/pendencies/PendencyDetail';
import { CreatePendencyModal } from '@/components/pendencies/CreatePendencyModal';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { PendencyDashboardView } from '@/lib/types';
import { Building2, Table as TableIcon, LayoutGrid, AlertTriangle, CheckCircle2, Plus, Clock } from 'lucide-react';

// Required for Next.js static export with dynamic routes
export async function generateStaticParams() {
  return [
    { slug: 'c-and-p' },
    { slug: 'cb-civil' },
    { slug: 'cb-mep' },
    { slug: 'design' },
    { slug: 'planning' },
    { slug: 'site' },
  ];
}

interface Props {
  params: Promise<{ slug: string }>;
}

export default function DepartmentPage({ params }: Props) {
  const { slug } = use(params);
  const deptName = DEPARTMENT_SLUGS[slug] || 'Department';

  const { userName } = useUserName();
  const {
    pendencies,
    loading,
    departments,
    towers,
    projects,
    types,
    refetch,
    updateCBEDate,
    updateStatus,
    updateRemarks,
    createPendency,
  } = usePendencies();

  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedItem, setSelectedItem] = useState<PendencyDashboardView | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter pendencies specifically for this department
  const deptPendencies = useMemo(() => {
    return pendencies.filter((p) => p.department_name.toLowerCase() === deptName.toLowerCase());
  }, [pendencies, deptName]);

  // Dept stats
  const stats = useMemo(() => {
    const open = deptPendencies.filter((p) => p.status === 'open');
    const overdue = open.filter((p) => p.is_overdue);
    const closed = deptPendencies.filter((p) => p.status === 'closed');
    const avgDays = open.length > 0 ? Math.round(open.reduce((acc, curr) => acc + curr.days_open, 0) / open.length) : 0;
    return {
      openCount: open.length,
      overdueCount: overdue.length,
      closedCount: closed.length,
      avgDays,
    };
  }, [deptPendencies]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" /> {deptName} Department Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dedicated view for {deptName} action items, approvals, and commitment dates across Woods towers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'table' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Log {deptName} Item
          </button>
        </div>
      </div>

      {/* Dept Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          title="Open Items"
          value={stats.openCount}
          subtitle={`${deptName} active items`}
          icon={Building2}
          colorClass="text-amber-600"
        />
        <SummaryCard
          title="Overdue Items"
          value={stats.overdueCount}
          subtitle="CBE date passed"
          icon={AlertTriangle}
          colorClass="text-rose-600"
        />
        <SummaryCard
          title="Closed Items"
          value={stats.closedCount}
          subtitle="Completed"
          icon={CheckCircle2}
          colorClass="text-emerald-600"
        />
        <SummaryCard
          title="Avg Days Open"
          value={`${stats.avgDays}d`}
          subtitle="Cycle time"
          icon={Clock}
          colorClass="text-blue-600"
        />
      </div>

      {/* View Content */}
      {viewMode === 'table' ? (
        <PendencyTable
          data={deptPendencies}
          loading={loading}
          departments={departments}
          towers={towers}
          projects={projects}
          types={types}
          userName={userName}
          onUpdateCBE={(id, date) => updateCBEDate(id, date, userName)}
          onUpdateStatus={(id, status) => updateStatus(id, status, userName)}
          onUpdateRemarks={(id, remarks) => updateRemarks(id, remarks, userName)}
          onSelectPendency={(item) => setSelectedItem(item)}
          onRefreshNeeded={refetch}
        />
      ) : (
        <KanbanBoard
          data={deptPendencies}
          onSelectItem={(item) => setSelectedItem(item)}
          onToggleStatus={(id, status) => updateStatus(id, status, userName)}
        />
      )}

      {/* Detail Slide-over */}
      {selectedItem && (
        <PendencyDetail
          pendency={selectedItem}
          onClose={() => setSelectedItem(null)}
          departments={departments}
          towers={towers}
          types={types}
          userName={userName}
          onSaved={refetch}
        />
      )}

      {/* Log Modal */}
      <CreatePendencyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        departments={departments}
        towers={towers}
        projects={projects}
        types={types}
        userName={userName}
        onCreate={(record) => createPendency({ ...record, department_id: departments.find((d) => d.name === deptName)?.id }, userName)}
      />
    </div>
  );
}
