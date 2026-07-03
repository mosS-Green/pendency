'use client';

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Building2,
  Table as TableIcon,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { DepartmentChart } from '@/components/dashboard/DepartmentChart';
import { CriticalityChart } from '@/components/dashboard/CriticalityChart';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { AttentionList } from '@/components/dashboard/AttentionList';
import { DepartmentKanban } from '@/components/dashboard/DepartmentKanban';
import { PendencyDetail } from '@/components/pendencies/PendencyDetail';
import { CreatePendencyModal } from '@/components/pendencies/CreatePendencyModal';
import { FAB } from '@/components/layout/FAB';
import { usePendencies } from '@/hooks/usePendencies';
import { useUserName } from '@/hooks/useUserName';
import { PendencyDashboardView } from '@/lib/types';

export default function DashboardPage() {
  const { userName } = useUserName();
  const { pendencies, loading, departments, towers, projects, types, refetch, createPendency } = usePendencies();
  const [selectedItem, setSelectedItem] = useState<PendencyDashboardView | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'overdue' | 'all'>('open');

  // Compute Dashboard Metrics from REAL data
  const metrics = useMemo(() => {
    const openItems = pendencies.filter((p) => p.status === 'open');
    const overdueItems = openItems.filter((p) => p.is_overdue);
    const closedItems = pendencies.filter((p) => p.status === 'closed');

    const totalDaysOpen = openItems.reduce((acc, curr) => acc + (curr.days_open || 0), 0);
    const avgDaysOpen = openItems.length > 0 ? Math.round(totalDaysOpen / openItems.length) : 0;

    const cbeSlippedCount = pendencies.reduce((acc, curr) => acc + (curr.cbe_change_count || 0), 0);

    // Department Breakdown Data
    const deptMap: Record<string, { department: string; open: number; overdue: number }> = {};
    departments.forEach((d) => {
      deptMap[d.name] = { department: d.name, open: 0, overdue: 0 };
    });

    openItems.forEach((item) => {
      if (deptMap[item.department_name]) {
        deptMap[item.department_name].open += 1;
        if (item.is_overdue) deptMap[item.department_name].overdue += 1;
      }
    });

    const deptChartData = Object.values(deptMap);

    // Criticality Counts
    const criticalCount = openItems.filter((p) => p.criticality === 'critical').length;
    const nonCriticalCount = openItems.filter((p) => p.criticality === 'non_critical').length;

    // Real Monthly Trend Data computed dynamically from actual DB opened_on & closed_on dates
    const monthsMap: Record<string, { month: string; opened: number; closed: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short' });
      monthsMap[key] = { month: label, opened: 0, closed: 0 };
    }

    pendencies.forEach((item) => {
      if (item.opened_on) {
        const openedKey = item.opened_on.substring(0, 7);
        if (monthsMap[openedKey]) {
          monthsMap[openedKey].opened += 1;
        }
      }
      if (item.closed_on) {
        const closedKey = item.closed_on.substring(0, 7);
        if (monthsMap[closedKey]) {
          monthsMap[closedKey].closed += 1;
        }
      }
    });

    const trendChartData = Object.values(monthsMap);

    return {
      openCount: openItems.length,
      overdueCount: overdueItems.length,
      closedCount: closedItems.length,
      avgDaysOpen,
      cbeSlippedCount,
      deptChartData,
      criticalCount,
      nonCriticalCount,
      trendChartData,
      overdueItems,
    };
  }, [pendencies, departments]);

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground text-xs animate-pulse">
        Loading Woods construction dashboard metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" /> Construction Executive Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time tracking of Woods project action items, commitment date slippages, and department performance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Log New Pendency
          </button>
          <Link
            href="/pendencies"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border bg-card text-foreground font-semibold text-xs hover:bg-muted shadow-2xs transition-colors"
          >
            <TableIcon className="w-4 h-4" /> View Register
          </Link>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard
          title="Total Open Items"
          value={metrics.openCount}
          subtitle="Action items blocking progress"
          icon={Building2}
          colorClass="text-amber-600"
          onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
          isActive={statusFilter === 'open'}
        />
        <SummaryCard
          title="Delayed / Overdue"
          value={metrics.overdueCount}
          subtitle="CBE date missed"
          icon={AlertTriangle}
          colorClass="text-rose-600"
          onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'open' : 'overdue')}
          isActive={statusFilter === 'overdue'}
        />
        <SummaryCard
          title="Closed Items"
          value={metrics.closedCount}
          subtitle="Click to view resolved items"
          icon={CheckCircle2}
          colorClass="text-emerald-600"
          onClick={() => setStatusFilter(statusFilter === 'closed' ? 'open' : 'closed')}
          isActive={statusFilter === 'closed'}
        />
        <SummaryCard
          title="Avg. Days Open"
          value={`${metrics.avgDaysOpen}d`}
          subtitle="Age of open items"
          icon={Clock}
          colorClass="text-blue-600"
          onClick={() => setStatusFilter('open')}
        />
        <SummaryCard
          title="CBE Shifts"
          value={metrics.cbeSlippedCount}
          subtitle="Times dates were pushed"
          icon={History}
          colorClass="text-purple-600"
          onClick={() => setStatusFilter('all')}
        />
      </div>

      {/* Department Board Section (C&P, C&B collated, Design) */}
      <DepartmentKanban
        data={pendencies}
        onSelectItem={(item) => setSelectedItem(item)}
        statusFilter={statusFilter}
      />

      {/* Main Charts & Attention Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <DepartmentChart data={metrics.deptChartData} />
          <TrendChart data={metrics.trendChartData} />
        </div>

        <div className="space-y-4">
          <CriticalityChart
            criticalCount={metrics.criticalCount}
            nonCriticalCount={metrics.nonCriticalCount}
          />
          <AttentionList
            overdueItems={metrics.overdueItems}
            onSelectItem={(item) => setSelectedItem(item)}
          />
        </div>
      </div>

      {/* Floating detail form window */}
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

      {/* Create Modal */}
      <CreatePendencyModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        departments={departments}
        towers={towers}
        projects={projects}
        types={types}
        userName={userName}
        onCreate={(record) => createPendency(record, userName)}
      />

      {/* Global FAB */}
      <FAB onClick={() => setIsCreateOpen(true)} />
    </div>
  );
}
