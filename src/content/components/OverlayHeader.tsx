import React from "react";
import type { ScrapeProgress } from "../../types";

interface OverlayHeaderProps {
  status: ScrapeProgress["status"];
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  uiPosition: "left" | "right";
  onTogglePosition: () => void;
}

export const OverlayHeader: React.FC<OverlayHeaderProps> = ({
  status,
  onClose,
  isCollapsed,
  onToggleCollapse,
  uiPosition,
  onTogglePosition,
}) => {
  return (
    <header className="px-4 py-3 bg-slate-950/80 flex justify-between items-center select-none shrink-0">
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            status === "scraping"
              ? "bg-indigo-500 animate-pulse"
              : status === "completed"
                ? "bg-emerald-500"
                : status === "error"
                  ? "bg-rose-500"
                  : "bg-slate-600"
          }`}
        />
        <h2 className="text-sm font-bold tracking-wide text-indigo-400 font-sans">
          NURETests Parser
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePosition}
          className="text-slate-400 hover:text-slate-200 transition cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded-lg"
          title={`Dock to ${uiPosition === "right" ? "left" : "right"}`}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            {uiPosition === "right" ? (
              <line x1="9" y1="3" x2="9" y2="21" />
            ) : (
              <line x1="15" y1="3" x2="15" y2="21" />
            )}
          </svg>
        </button>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-slate-200 transition cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded-lg"
          title={isCollapsed ? "Restore window" : "Minimize window"}
        >
          {isCollapsed ? (
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
          ) : (
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          )}
        </button>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-rose-500/20 rounded-lg"
          title="Close"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </header>
  );
};
