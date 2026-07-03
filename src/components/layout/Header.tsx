'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Sun, Moon, RefreshCw, Download, ShieldCheck, Search } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface Props {
  userName: string;
  onOpenIdentityModal: () => void;
  lastSyncedAt: Date | null;
  onManualRefresh: () => void;
  isSyncing: boolean;
}

export function Header({
  userName,
  onOpenIdentityModal,
  lastSyncedAt,
  onManualRefresh,
  isSyncing,
}: Props) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const { isInstallable, promptInstall } = usePWAInstall();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalQuery.trim()) {
      router.push(`/pendencies?search=${encodeURIComponent(globalQuery.trim())}`);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Not synced';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    return `${diffMin}m ago`;
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-card px-4 shadow-2xs gap-3">
      {/* Left Brand & Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2.5 font-semibold text-base text-foreground">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-sm shadow-xs select-none">
            P
          </div>
          <span className="hidden sm:inline">Woods Pendency</span>
        </div>
        <span className="hidden lg:inline-block h-4 w-px bg-border" />
        <span className="hidden lg:inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Internal App
        </span>
      </div>

      {/* Global Header Search Bar */}
      <form onSubmit={handleGlobalSearch} className="relative flex-1 max-w-md hidden md:block">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Global search pendencies across project..."
          value={globalQuery}
          onChange={(e) => setGlobalQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </form>

      {/* Right Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* PWA Install Button */}
        {isInstallable && (
          <button
            onClick={promptInstall}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors shadow-2xs"
            title="Install app to desktop / home screen"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Sync Indicator */}
        <button
          onClick={onManualRefresh}
          disabled={isSyncing}
          title="Manual Sync / Refetch"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-primary' : ''}`} />
          <span className="hidden lg:inline">{formatLastSync(lastSyncedAt)}</span>
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Identity Chip */}
        <button
          onClick={onOpenIdentityModal}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted transition-colors"
          title="Change display name"
        >
          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-medium text-foreground max-w-[100px] truncate">
              {userName}
            </span>
            <span className="text-[10px] text-muted-foreground -mt-0.5">Not you?</span>
          </div>
        </button>
      </div>
    </header>
  );
}
