'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pendency_tracker_user_name';

export function useUserName() {
  const [userName, setUserName] = useState<string>('Unknown');
  const [isPromptOpen, setIsPromptOpen] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored.trim() !== '') {
      setUserName(stored.trim());
    } else {
      setIsPromptOpen(true);
    }
  }, []);

  const saveUserName = (newName: string) => {
    const formatted = newName.trim() || 'Unknown';
    setUserName(formatted);
    localStorage.setItem(STORAGE_KEY, formatted);
    setIsPromptOpen(false);
  };

  return {
    userName,
    saveUserName,
    isPromptOpen,
    setIsPromptOpen,
  };
}
