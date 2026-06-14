import React from "react";
import { AlertCircle } from "lucide-react";

interface NoQuestionsViewProps {
  onClose: () => void;
}

export const NoQuestionsView: React.FC<NoQuestionsViewProps> = ({
  onClose,
}) => {
  return (
    <div className="flex flex-col gap-4 min-h-0 text-left">
      <div className="flex items-center gap-3 text-rose-400">
        <AlertCircle size={20} />
        <h3 className="text-sm font-bold tracking-wide text-rose-300">
          No Questions Detected
        </h3>
      </div>

      <div
        className="p-3 bg-rose-500/10 rounded-lg text-xs leading-relaxed text-slate-300 space-y-2"
        style={{ border: "1px solid rgba(244, 63, 94, 0.2)" }}
      >
        <p>
          This page does not seem to contain a Moodle quiz or any visible
          questions.
        </p>
        <p>
          Please navigate to a quiz attempt, summary, or review page on{" "}
          <strong>dl.nure.ua</strong> and try again.
        </p>
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer text-center"
        >
          Close
        </button>
      </div>
    </div>
  );
};
