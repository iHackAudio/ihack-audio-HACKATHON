import React, { useEffect } from 'react';

export function Toast({ message, onClose }: any) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slideUp bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl border border-white/10 flex items-center gap-3">
      {message}
    </div>
  );
}
