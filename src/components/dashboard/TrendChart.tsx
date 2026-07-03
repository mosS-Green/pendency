'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Props {
  data: { month: string; opened: number; closed: number }[];
}

export function TrendChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        Monthly Trend: Opened vs Closed
      </h3>

      <div className="h-56 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" stroke="#9E9A90" fontSize={11} />
            <YAxis stroke="#9E9A90" fontSize={11} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Area type="monotone" dataKey="opened" stroke="#C25E00" fill="#C25E00" fillOpacity={0.15} name="Opened" />
            <Area type="monotone" dataKey="closed" stroke="#2D6A4F" fill="#2D6A4F" fillOpacity={0.15} name="Closed" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
