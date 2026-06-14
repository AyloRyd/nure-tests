import React from "react";
import { Copy, Check } from "lucide-react";

interface OverlayFooterProps {
  onCopy?: () => void;
  copyFeedback?: string | null;
  showCopyButton: boolean;
  autoSelect?: boolean;
  onToggleAutoSelect?: (val: boolean) => void;
  showAutoSelect: boolean;
}

export const OverlayFooter: React.FC<OverlayFooterProps> = ({
  onCopy,
  copyFeedback,
  showCopyButton,
  autoSelect = true,
  onToggleAutoSelect,
  showAutoSelect,
}) => {
  const isOnlyCopy = showCopyButton && !showAutoSelect;

  return (
    <div
      className={`bg-slate-950/40 border-t border-slate-900/50 flex items-center shrink-0 ${
        isOnlyCopy ? "h-12 p-0" : "h-12 px-4 justify-between gap-3"
      }`}
    >
      {!isOnlyCopy && showAutoSelect && (
        <div className="flex items-center gap-2 select-none">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoSelect}
              onChange={(e) => onToggleAutoSelect?.(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
          </label>
          <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">
            Auto-apply answers
          </span>
        </div>
      )}

      {showCopyButton && onCopy && (
        <button
          onClick={onCopy}
          className={
            isOnlyCopy
              ? "w-full h-full bg-[#0a1024] hover:bg-slate-800 active:bg-slate-900 transition-colors duration-150 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 text-slate-100 font-sans select-none rounded-none"
              : "py-1.5 px-3 rounded-lg bg-[#0a1024] hover:bg-slate-800 border border-slate-800/80 active:scale-[0.98] transition-all duration-150 text-[10px] font-bold shadow-lg shadow-slate-950/10 cursor-pointer flex items-center justify-center gap-1.5 text-slate-100 font-sans select-none"
          }
        >
          {copyFeedback ? (
            <>
              <Check size={13} />
              {copyFeedback}
            </>
          ) : (
            <>
              <Copy size={13} />
              Copy to Clipboard
            </>
          )}
        </button>
      )}
    </div>
  );
};
