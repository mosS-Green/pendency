'use client';

import React, { useState, useEffect } from 'react';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { UserIdentityModal } from '@/components/layout/UserIdentityModal';
import { useUserName } from '@/hooks/useUserName';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { userName, saveUserName, isPromptOpen, setIsPromptOpen } = useUserName();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize live realtime sync + 15 min fallback polling
  const { lastSyncedAt, isSyncing, refetchAll } = useRealtimeSync();

  useEffect(() => {
    // Theme setup from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Woods — Construction Pendency Tracker</title>
        <meta name="description" content="Track, resolve, and audit open action items, approvals, and CBE date changes across Woods construction project." />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#C25E00" />
      </head>
      <body className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased selection:bg-primary/20">
        <Header
          userName={userName}
          onOpenIdentityModal={() => setIsPromptOpen(true)}
          lastSyncedAt={lastSyncedAt}
          onManualRefresh={refetchAll}
          isSyncing={isSyncing}
        />

        <div className="flex flex-1 w-full">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden min-h-[calc(100vh-3.5rem)]">
            {children}
          </main>
        </div>

        <UserIdentityModal
          isOpen={isPromptOpen}
          onClose={() => setIsPromptOpen(false)}
          currentName={userName}
          onSave={saveUserName}
        />
      </body>
    </html>
  );
}
