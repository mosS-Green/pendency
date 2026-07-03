'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Table as TableIcon, LayoutGrid, Layers, CreditCard } from 'lucide-react';
import { PendencyTable } from '@/components/pendencies/PendencyTable';
import { PendencyCardList } from '@/components/pendencies/PendencyCardList';
import { KanbanBoard } from '@/components/pendencies/KanbanBoard';
import { PendencyDetail } from '@/components/pendencies/PendencyDetail';
import { CreatePendencyModal } from '@/components/pendencies/CreatePendencyModal';
import { FAB } from '@/components/layout/FAB';
import { usePendencies } from '@/hooks/usePendencies';
import { useUserName } from '@/hooks/useUserName';
import { PendencyDashboardView } from '@/lib/types';

function PendenciesContent() {
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get('search') || '';

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

  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'kanban'>('cards');
  const [selectedPendency, setSelectedPendency] = useState<PendencyDashboardView | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" /> Construction Pendencies Register
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log, update CBE target dates, monitor date shifts, and close open site action items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Cards / Table / Kanban */}
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode('cards')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'cards' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" /> Log New Pendency
          </button>
        </div>
      </div>

      {/* Main View Display */}
      {viewMode === 'cards' ? (
        <PendencyCardList
          items={pendencies}
          onSelectItem={(item) => setSelectedPendency(item)}
          onUpdateCBE={(id, date) => updateCBEDate(id, date, userName)}
          onUpdateStatus={(id, status) => updateStatus(id, status, userName)}
        />
      ) : viewMode === 'table' ? (
        <PendencyTable
          data={pendencies}
          loading={loading}
          departments={departments}
          towers={towers}
          projects={projects}
          types={types}
          userName={userName}
          onUpdateCBE={(id, date) => updateCBEDate(id, date, userName)}
          onUpdateStatus={(id, status) => updateStatus(id, status, userName)}
          onUpdateRemarks={(id, remarks) => updateRemarks(id, remarks, userName)}
          onSelectPendency={(item) => setSelectedPendency(item)}
          onRefreshNeeded={refetch}
          initialSearch={initialSearchQuery}
        />
      ) : (
        <KanbanBoard
          data={pendencies}
          onSelectItem={(item) => setSelectedPendency(item)}
          onToggleStatus={(id, status) => updateStatus(id, status, userName)}
        />
      )}

      {/* Slide-over / Floating Form Window */}
      {selectedPendency && (
        <PendencyDetail
          pendency={selectedPendency}
          onClose={() => setSelectedPendency(null)}
          departments={departments}
          towers={towers}
          types={types}
          userName={userName}
          onSaved={refetch}
        />
      )}

      {/* Log New Item Modal */}
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

      {/* Global Floating Action Button (FAB) */}
      <FAB onClick={() => setIsCreateOpen(true)} />
    </div>
  );
}

export default function AllPendenciesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading register...</div>}>
      <PendenciesContent />
    </Suspense>
  );
}
