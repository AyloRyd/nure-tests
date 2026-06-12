import React from "react";

interface OverlayFooterProps {
  onCopy: () => void;
  copyFeedback: string | null;
}

export const OverlayFooter: React.FC<OverlayFooterProps> = ({
  onCopy,
  copyFeedback,
}) => {
  return (
    <div className="p-4 bg-slate-950/40 flex justify-between items-center gap-3">
      <button
        onClick={onCopy}
        className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-[0.98] transition text-xs font-bold shadow-lg shadow-indigo-600/10 cursor-pointer text-center text-slate-100 font-sans"
      >
        {copyFeedback ? copyFeedback : "Copy to Clipboard"}
      </button>
    </div>
  );
};
