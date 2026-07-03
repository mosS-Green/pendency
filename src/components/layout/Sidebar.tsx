'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Table,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
  HardHat,
  DraftingCompass,
  FileText,
  Calculator,
  Zap,
  CalendarDays,
} from 'lucide-react';

interface Props {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed }: Props) {
  const pathname = usePathname();

  const deptLinks = [
    { name: 'C&P', href: '/departments/c-and-p', icon: FileText, color: 'text-amber-700 dark:text-amber-400' },
    { name: 'C&B - Civil', href: '/departments/cb-civil', icon: Calculator, color: 'text-blue-700 dark:text-blue-400' },
    { name: 'C&B - MEP', href: '/departments/cb-mep', icon: Zap, color: 'text-purple-700 dark:text-purple-400' },
    { name: 'Design', href: '/departments/design', icon: DraftingCompass, color: 'text-cyan-700 dark:text-cyan-400' },
    { name: 'Planning', href: '/departments/planning', icon: CalendarDays, color: 'text-emerald-700 dark:text-emerald-400' },
    { name: 'Site', href: '/departments/site', icon: HardHat, color: 'text-orange-700 dark:text-orange-400' },
  ];

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname?.startsWith(path));

  return (
    <aside
      className={`relative sticky top-14 h-[calc(100vh-3.5rem)] border-r border-border bg-sidebar transition-all duration-200 ease-in-out flex flex-col justify-between ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="p-3 space-y-6 overflow-y-auto">
        {/* Main Nav Section */}
        <div className="space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/') && pathname === '/'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-sidebar-foreground hover:bg-muted'
            }`}
            title="Dashboard Overview"
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Dashboard</span>}
          </Link>

          <Link
            href="/pendencies"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/pendencies')
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-sidebar-foreground hover:bg-muted'
            }`}
            title="All Pendencies Table"
          >
            <Table className="w-4 h-4 shrink-0" />
            {!collapsed && <span>All Pendencies</span>}
          </Link>
        </div>

        {/* Departments Section */}
        <div>
          {!collapsed && (
            <h4 className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Departments
            </h4>
          )}
          <div className="space-y-1">
            {deptLinks.map((dept) => {
              const Icon = dept.icon;
              const active = isActive(dept.href);
              return (
                <Link
                  key={dept.href}
                  href={dept.href}
                  className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-card text-foreground shadow-2xs font-semibold border border-border'
                      : 'text-sidebar-foreground hover:bg-muted'
                  }`}
                  title={dept.name}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${dept.color}`} />
                  {!collapsed && <span className="truncate">{dept.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* System Settings Section */}
        <div>
          {!collapsed && (
            <h4 className="px-3 mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Management
            </h4>
          )}
          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive('/admin')
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-sidebar-foreground hover:bg-muted'
            }`}
            title="Admin & Lookup Settings"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Admin Settings</span>}
          </Link>
        </div>
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-border flex justify-end">
        <button
          onClick={onToggleCollapsed}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full flex items-center justify-center"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
