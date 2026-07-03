'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface Props {
  onClick: () => void;
}

export function FAB({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-105 hover:bg-primary-hover active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/40 group"
      title="Log New Pendency Item"
      aria-label="Log New Pendency"
    >
      <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
    </button>
  );
}
