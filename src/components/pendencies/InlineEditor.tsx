'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, Edit2, Clock } from 'lucide-react';

interface DateEditorProps {
  value: string | null;
  onSave: (newDate: string | null) => void;
  disabled?: boolean;
}

export function InlineDatePicker({ value, onSave, disabled }: DateEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [dateVal, setDateVal] = useState(value || '');

  useEffect(() => {
    setDateVal(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setDateVal(newVal);
    onSave(newVal || null);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="date"
          value={dateVal}
          onChange={handleChange}
          onBlur={() => setIsEditing(false)}
          className="px-1.5 py-0.5 text-xs rounded border border-primary bg-background text-foreground focus:outline-none"
          autoFocus
        />
        <button
          onClick={() => setIsEditing(false)}
          className="p-0.5 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => !disabled && setIsEditing(true)}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-colors border border-dashed hover:border-solid ${
        value
          ? 'border-border bg-card hover:bg-muted text-foreground'
          : 'border-amber-400/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
      }`}
      title="Click to change CBE Date"
    >
      <Calendar className="w-3 h-3 text-muted-foreground" />
      <span>{value ? value : 'Set CBE Date'}</span>
    </button>
  );
}

interface StatusToggleProps {
  status: 'open' | 'closed';
  onToggle: (newStatus: 'open' | 'closed') => void;
  disabled?: boolean;
}

export function InlineStatusToggle({ status, onToggle, disabled }: StatusToggleProps) {
  return (
    <button
      onClick={() => !disabled && onToggle(status === 'open' ? 'closed' : 'open')}
      disabled={disabled}
      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase transition-transform active:scale-95 border ${
        status === 'open'
          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/50 hover:bg-amber-500/25'
          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-300'
      }`}
      title={`Click to switch to ${status === 'open' ? 'Closed' : 'Open'}`}
    >
      {status}
    </button>
  );
}

interface RemarksEditorProps {
  value: string | null;
  onSave: (newRemarks: string) => void;
}

export function InlineTextEditor({ value, onSave }: RemarksEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value || '');

  useEffect(() => {
    setText(value || '');
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== (value || '')) {
      onSave(text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setText(value || '');
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-xs rounded border border-primary bg-background text-foreground focus:outline-none"
          placeholder="Enter current status / remarks..."
          autoFocus
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="group flex items-center justify-between gap-1 cursor-pointer py-1 px-1.5 rounded hover:bg-muted/70 transition-colors max-w-full"
      title="Click to edit remarks"
    >
      <span className="text-xs text-foreground truncate">
        {value && value.trim() ? value : <span className="text-muted-foreground italic">Add remark...</span>}
      </span>
      <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
    </div>
  );
}
