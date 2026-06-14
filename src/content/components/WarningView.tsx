import React from "react";
import { AlertTriangle } from "lucide-react";

interface WarningViewProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const WarningView: React.FC<WarningViewProps> = ({
  onClose,
  onConfirm,
}) => {
  return (
    <div className="p-1 flex flex-col gap-4 min-h-0 text-left">
      <div className="flex items-center gap-3 text-rose-400">
        <AlertTriangle size={20} />
        <h3 className="text-sm font-bold tracking-wide text-rose-300">
          Moodle Quiz Navigation Warning
        </h3>
      </div>

      <div
        className="p-3 bg-rose-500/10 rounded-lg text-xs leading-relaxed text-slate-300 space-y-2"
        style={{ border: "1px solid rgba(244, 63, 94, 0.2)" }}
      >
        <p className="font-semibold text-rose-200">
          Do NOT parse quizzes with Sequential Navigation!
        </p>
        <p>
          Sequential quizzes prevent going back to previous pages. Parsing
          fetches all pages in the background, which advances your attempt.
        </p>
        <p className="font-bold text-rose-200">
          This will lock you out of all previous questions and result in a 0
          grade for them.
        </p>
      </div>

      <div className="p-3 bg-slate-950/40 rounded-lg text-xs leading-relaxed text-slate-400">
        <p>
          Support for parsing only the <strong>single current question</strong>{" "}
          will be implemented in a future update to make sequential quizzes
          safe.
        </p>
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer text-center"
        >
          Cancel & Close
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer text-center"
        >
          Proceed
        </button>
      </div>
    </div>
  );
};
