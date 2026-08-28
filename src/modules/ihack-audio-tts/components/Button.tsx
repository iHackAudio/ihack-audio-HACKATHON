import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({ children, onClick, disabled, isLoading, className, icon, size = 'default', glowColor }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center gap-2 font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } ${className}`}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && icon}
      {children}
    </button>
  );
}
