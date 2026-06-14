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
    <div className="flex-1 flex flex-col min-h-0 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
          Parsed Output ({questions.length} questions)
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => onChangeFormat("standard")}
            className={`text-[10px] px-2 py-0.5 rounded-lg transition cursor-pointer ${
              outputFormat === "standard"
                ? "bg-indigo-600/20 text-indigo-400 font-semibold"
                : "bg-transparent text-slate-400 hover:text-slate-200"
            }`}
            style={{
              border:
                outputFormat === "standard"
                  ? "1px solid rgba(99, 102, 241, 0.3)"
                  : "none",
            }}
          >
            Standard
          </button>
          <button
            onClick={() => onChangeFormat("ai")}
            className={`text-[10px] px-2 py-0.5 rounded-lg transition cursor-pointer ${
              outputFormat === "ai"
                ? "bg-indigo-600/20 text-indigo-400 font-semibold"
                : "bg-transparent text-slate-400 hover:text-slate-200"
            }`}
            style={{
              border:
                outputFormat === "ai"
                  ? "1px solid rgba(99, 102, 241, 0.3)"
                  : "none",
            }}
          >
            AI Prompt
          </button>
        </div>
      </div>

      <textarea
        readOnly
        value={outputText}
        className="flex-1 w-full bg-slate-950/70 rounded-lg p-3 font-mono text-[10px] text-slate-300 resize-none focus:outline-none"
      />
    </div>
  );
};
