'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorClass?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export function SummaryCard({ title, value, subtitle, icon: Icon, colorClass = 'text-primary', onClick, isActive }: Props) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 shadow-2xs space-y-2 flex flex-col justify-between transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-primary/50 hover:shadow-sm' : ''
      } ${
        isActive
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className={`p-2 rounded-lg bg-muted ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="text-2xl font-bold font-mono tracking-tight text-foreground">{value}</div>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
