'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Props {
  data: { department: string; open: number; overdue: number }[];
}

const DEPT_COLORS = ['#8D6E63', '#1565C0', '#6A1B9A', '#00838F', '#2E7D32', '#D84315'];

export function DepartmentChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3">
      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
        Open Pendencies by Department
      </h3>

      <div className="h-56 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
            <XAxis type="number" stroke="#9E9A90" fontSize={11} tickLine={false} />
            <YAxis dataKey="department" type="category" stroke="#9E9A90" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="open" radius={[0, 4, 4, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
