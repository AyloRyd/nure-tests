import React from "react";
import type { ScrapeProgress } from "../../types";
import { Columns2, Minus, Maximize2, X, RotateCcw } from "lucide-react";

interface OverlayHeaderProps {
  status: ScrapeProgress["status"];
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  uiPosition: "left" | "right";
  onTogglePosition: () => void;
  onResetAll?: () => void;
}

export const OverlayHeader: React.FC<OverlayHeaderProps> = ({
  status,
  onClose,
  isCollapsed,
  onToggleCollapse,
  uiPosition,
  onTogglePosition,
  onResetAll,
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
          onClick={onResetAll}
          className="text-slate-400 hover:text-slate-200 transition cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded-lg"
          title="Fresh Start (Delete all state)"
        >
          <RotateCcw size={12} />
        </button>
        <button
          onClick={onTogglePosition}
          className="text-slate-400 hover:text-slate-200 transition cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded-lg"
          title={`Dock to ${uiPosition === "right" ? "left" : "right"}`}
        >
          <Columns2 size={13} />
        </button>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-slate-200 transition cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded-lg"
          title={isCollapsed ? "Restore window" : "Minimize window"}
        >
          {isCollapsed ? <Maximize2 size={11} /> : <Minus size={11} />}
        </button>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition cursor-pointer w-7 h-7 flex items-center justify-center hover:bg-rose-500/20 rounded-lg"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>
    </header>
  );
};
