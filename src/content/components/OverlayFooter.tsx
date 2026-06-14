import React from "react";

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
              ? "w-full h-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-colors duration-150 text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 text-slate-100 font-sans select-none rounded-none"
              : "py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all duration-150 text-[10px] font-bold shadow-lg shadow-indigo-600/10 cursor-pointer flex items-center justify-center gap-1.5 text-slate-100 font-sans select-none"
          }
        >
          {copyFeedback ? (
            <>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {copyFeedback}
            </>
          ) : (
            <>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copy to Clipboard
            </>
          )}
        </button>
      )}
    </div>
  );
};
