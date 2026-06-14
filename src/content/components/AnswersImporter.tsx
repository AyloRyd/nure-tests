import React, { useState } from "react";
import type { AiAnswers } from "../../types";
import { autoSelectAllVisibleQuestions } from "../utils/AnswerSelector";

interface AnswersImporterProps {
  onAnswersImport: (answers: AiAnswers) => void;
}

export const AnswersImporter: React.FC<AnswersImporterProps> = ({
  onAnswersImport,
}) => {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const handleImport = () => {
    setError(null);
    setSuccessCount(null);

    if (!jsonInput.trim()) {
      setError("Please paste a JSON object containing the answers.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          "Answers must be a JSON object mapping questions to answers.",
        );
      }

      const answers: AiAnswers = {};
      Object.entries(parsed).forEach(([key, val]) => {
        if (!Array.isArray(val)) {
          throw new Error(
            `Value for question "${key.substring(0, 20)}..." must be an array of strings.`,
          );
        }
        answers[key] = val.map(String);
      });

      onAnswersImport(answers);

      const matched = autoSelectAllVisibleQuestions(answers);
      setSuccessCount(matched);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to parse JSON: ${errMsg}`);
    }
  };

  return (
    <div className="space-y-4 flex flex-col justify-between min-h-0 py-1">
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Import AI JSON Answers
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Paste the JSON response obtained from the AI. The parser will
          automatically map the answers to the questions currently on your
          screen, select them, and highlight them with a brief glow.
        </p>
      </div>

      <textarea
        placeholder='Paste JSON here, e.g.:&#10;{&#10;  "Question Text?": ["Correct Option Text"]&#10;}'
        value={jsonInput}
        onChange={(e) => setJsonInput(e.target.value)}
        className="h-[140px] w-full bg-[#0a1024] border border-slate-800/80 rounded-lg p-3 font-mono text-[10px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
      />

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] text-rose-300 leading-relaxed">
          {error}
        </div>
      )}

      {successCount !== null && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-300 leading-relaxed">
          ✓ Loaded answers! Auto-selected choice options for{" "}
          <strong>{successCount}</strong> visible question(s) on this page.
        </div>
      )}

      <button
        onClick={handleImport}
        className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer text-center select-none"
      >
        Import & Apply Answers
      </button>
    </div>
  );
};
