'use client';

import React, { useState } from 'react';
import { User, X, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (name: string) => void;
}

export function UserIdentityModal({ isOpen, onClose, currentName, onSave }: Props) {
  const [nameInput, setNameInput] = useState(currentName === 'Unknown' ? '' : currentName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onSave(nameInput.trim());
    } else {
      onSave('Unknown');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">Set Your Display Name</h3>
              <p className="text-xs text-muted-foreground">Used to tag edits, comments, and CBE updates</p>
            </div>
          </div>
          {currentName !== 'Unknown' && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user-name-input" className="block text-xs font-medium text-muted-foreground mb-1">
              Your Name / Role
            </label>
            <input
              id="user-name-input"
              type="text"
              required
              placeholder="e.g. Rajesh Kumar (Site Manager)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
          </div>

          <p className="text-xs text-muted-foreground bg-muted p-2.5 rounded-md">
            No password or login required. Your name is stored locally in your browser for audit history attribution.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary-hover transition-colors shadow-xs"
            >
              <Check className="w-4 h-4" /> Save & Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
