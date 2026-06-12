import React from 'react';
import type { ScrapeProgress } from '../../types';

interface OverlayHeaderProps {
  status: ScrapeProgress['status'];
  onClose: () => void;
}

export const OverlayHeader: React.FC<OverlayHeaderProps> = ({
  status,
  onClose,
}) => {
  return (
    <header className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            status === 'scraping'
              ? 'bg-indigo-500 animate-pulse'
              : status === 'completed'
                ? 'bg-emerald-500'
                : status === 'error'
                  ? 'bg-rose-500'
                  : 'bg-slate-600'
          }`}
        />
        <h2 className="text-sm font-bold tracking-wide text-indigo-400 font-sans">
          NURETests Parser
        </h2>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-200 transition text-xs font-semibold cursor-pointer px-2 py-1 bg-slate-850 hover:bg-slate-800 rounded-lg border border-slate-800/80"
      >
        Close
      </button>
    </header>
  );
};
