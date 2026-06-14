import React, { useState } from "react";
import type { Question } from "../../types";
import { useScraper } from "../hooks/useScraper";
import { formatQuizData, formatForAI } from "../../core/formatter";
import { OverlayHeader } from "./OverlayHeader";
import { LogsTerminal } from "./LogsTerminal";
import { OutputViewer } from "./OutputViewer";
import { OverlayFooter } from "./OverlayFooter";

interface OverlayProps {
  onClose: () => void;
  onScrapeFinish: (questions: Question[]) => void;
}

export const Overlay: React.FC<OverlayProps> = ({
  onClose,
  onScrapeFinish,
}) => {
  const [hasConfirmedWarning, setHasConfirmedWarning] = useState(false);
  const hasQuestionsOnPage = React.useMemo(() => {
    return document.querySelectorAll(".qnbutton, .que").length > 0;
  }, []);
  const { status, logs, questions } = useScraper(
    hasConfirmedWarning && hasQuestionsOnPage,
    onScrapeFinish,
  );
  const [outputFormat, setOutputFormat] = useState<"standard" | "ai">(
    "standard",
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getOutputText = () => {
    if (outputFormat === "ai") {
      return formatForAI(questions);
    }
    return formatQuizData(questions);
  };

  const handleCopy = () => {
    const text = getOutputText();
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyFeedback("Copied!");
        setTimeout(() => setCopyFeedback(null), 2000);
      })
      .catch((err: unknown) => {
        console.error("Clipboard copy failed:", err);
      });
  };

  return (
    <div
      className="fixed top-3 right-3 w-[420px] bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl flex flex-col font-sans text-slate-100 z-[99999] overflow-hidden"
      style={{
        border: "1px solid #64748b",
        ...(isCollapsed
          ? {}
          : hasConfirmedWarning && hasQuestionsOnPage
            ? { height: "85vh" }
            : { height: "auto" }),
      }}
    >
      <OverlayHeader
        status={status}
        onClose={onClose}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {!isCollapsed && (
        <>
          {!hasQuestionsOnPage ? (
            <div className="p-5 flex flex-col gap-4 min-h-0">
              <div className="flex items-center gap-3 text-rose-400">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <h3 className="text-sm font-bold tracking-wide text-rose-300">
                  No Questions Detected
                </h3>
              </div>

              <div
                className="p-3 bg-rose-500/10 rounded-lg text-xs leading-relaxed text-slate-300 space-y-2"
                style={{ border: "1px solid rgba(244, 63, 94, 0.2)" }}
              >
                <p>
                  This page does not seem to contain a Moodle quiz or any
                  visible questions.
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
          ) : !hasConfirmedWarning ? (
            <div className="p-5 flex flex-col gap-4 min-h-0">
              <div className="flex items-center gap-3 text-rose-400">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
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
                  Sequential quizzes prevent going back to previous pages.
                  Parsing fetches all pages in the background, which advances
                  your attempt.
                </p>
                <p className="font-bold text-rose-200">
                  This will lock you out of all previous questions and result in
                  a 0 grade for them.
                </p>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-lg text-xs leading-relaxed text-slate-400">
                <p>
                  Support for parsing only the{" "}
                  <strong>single current question</strong> will be implemented
                  in a future update to make sequential quizzes safe.
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
                  onClick={() => setHasConfirmedWarning(true)}
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer text-center"
                >
                  Proceed
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col justify-between min-h-0">
                <LogsTerminal logs={logs} status={status} />

                {status === "completed" && (
                  <OutputViewer
                    questions={questions}
                    outputFormat={outputFormat}
                    onChangeFormat={setOutputFormat}
                    outputText={getOutputText()}
                  />
                )}
              </div>

              {status === "completed" && (
                <OverlayFooter
                  onCopy={handleCopy}
                  copyFeedback={copyFeedback}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
