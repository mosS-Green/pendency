'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props {
  criticalCount: number;
  nonCriticalCount: number;
}

export function CriticalityChart({ criticalCount, nonCriticalCount }: Props) {
  const data = [
    { name: 'Critical', value: criticalCount, color: '#B71C1C' },
    { name: 'Non-Critical', value: nonCriticalCount, color: '#1565C0' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        Criticality Breakdown
      </h3>

      <div className="h-56 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
