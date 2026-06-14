import React from "react";
import type { Question } from "../../types";

interface OutputViewerProps {
  questions: Question[];
  outputFormat: "standard" | "ai";
  onChangeFormat: (format: "standard" | "ai") => void;
  outputText: string;
}

export const OutputViewer: React.FC<OutputViewerProps> = ({
  questions,
  outputFormat,
  onChangeFormat,
  outputText,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0 select-none">
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1">
          Parsed Output ({questions.length} questions)
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChangeFormat("standard")}
            className={`text-[11px] px-3 py-1 rounded-lg transition cursor-pointer select-none font-bold ${
              outputFormat === "standard"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "bg-slate-950/40 text-slate-400 border border-slate-800/60 hover:text-slate-200"
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => onChangeFormat("ai")}
            className={`text-[11px] px-3 py-1 rounded-lg transition cursor-pointer select-none font-bold ${
              outputFormat === "ai"
                ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                : "bg-slate-950/40 text-slate-400 border border-slate-800/60 hover:text-slate-200"
            }`}
          >
            AI Prompt
          </button>
        </div>
      </div>

      <textarea
        readOnly
        value={outputText}
        className="flex-1 w-full bg-[#0a1024] border border-slate-800/80 rounded-lg p-3 font-mono text-[10px] text-slate-300 resize-none focus:outline-none"
      />
    </div>
  );
};
