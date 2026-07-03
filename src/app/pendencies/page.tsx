'use client';

import React, { useState } from 'react';
import { Plus, Table as TableIcon, Layers } from 'lucide-react';
import { PendencyTable } from '@/components/pendencies/PendencyTable';
import { PendencyDetail } from '@/components/pendencies/PendencyDetail';
import { CreatePendencyModal } from '@/components/pendencies/CreatePendencyModal';
import { usePendencies } from '@/hooks/usePendencies';
import { useUserName } from '@/hooks/useUserName';
import { PendencyDashboardView } from '@/lib/types';

export default function AllPendenciesPage() {
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

  const [selectedPendency, setSelectedPendency] = useState<PendencyDashboardView | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-primary" /> Construction Pendencies Register
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log, update CBE target dates, monitor date shifts, and close open site action items.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary-hover shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Log New Pendency
        </button>
      </div>

      {/* Main Table */}
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
      />

      {/* Slide-over Detail Panel */}
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
    </div>
  );
}
