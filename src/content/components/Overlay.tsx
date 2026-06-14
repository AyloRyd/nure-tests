import React, { useState, useEffect, useCallback } from "react";
import type { Question, AiAnswers } from "../../types";
import { useScraper } from "../hooks/useScraper";
import { formatQuizData, formatForAI } from "../../core/formatter";
import { OverlayHeader } from "./OverlayHeader";
import { LogsTerminal } from "./LogsTerminal";
import { OutputViewer } from "./OutputViewer";
import { OverlayFooter } from "./OverlayFooter";
import { AnswersImporter } from "./AnswersImporter";
import { CurrentQuestionsView } from "./CurrentQuestionsView";
import { saveSession, clearSession } from "../../core/storage";
import type { StoredSession } from "../../core/storage";
import { autoSelectAllVisibleQuestions } from "../utils/AnswerSelector";

interface OverlayProps {
  onClose: () => void;
  onScrapeFinish: (questions: Question[]) => void;
  initialSession?: StoredSession;
}

export const Overlay: React.FC<OverlayProps> = ({
  onClose,
  onScrapeFinish,
  initialSession,
}) => {
  const [activeMainTab, setActiveMainTab] = useState<
    "parse-test" | "import-answers"
  >(initialSession?.activeMainTab || "parse-test");

  const [activeSubTab, setActiveSubTab] = useState<
    "json-output" | "current-questions"
  >(initialSession?.activeSubTab || "current-questions");

  const [hasConfirmedWarning, setHasConfirmedWarning] = useState<boolean>(
    initialSession?.hasConfirmedWarning || false,
  );

  const [aiAnswers, setAiAnswers] = useState<AiAnswers | null>(
    initialSession?.aiAnswers || null,
  );

  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    initialSession?.isCollapsed || false,
  );

  const [uiPosition, setUiPosition] = useState<"left" | "right">(
    initialSession?.uiPosition || "right",
  );

  const [autoSelect, setAutoSelect] = useState<boolean>(
    initialSession?.autoSelect ?? true,
  );

  const hasQuestionsOnPage = React.useMemo(() => {
    return document.querySelectorAll(".qnbutton, .que").length > 0;
  }, []);

  const activeQuestionsCount = React.useMemo(() => {
    return document.querySelectorAll(".que").length;
  }, []);

  // Auto-apply answers to the page on mount/restore
  useEffect(() => {
    if (aiAnswers && autoSelect) {
      autoSelectAllVisibleQuestions(aiAnswers);
    }
  }, [aiAnswers, autoSelect]);

  const handleScrapeFinish = useCallback(
    (parsedQuestions: Question[]) => {
      saveSession({ questions: parsedQuestions });
      if (onScrapeFinish) {
        onScrapeFinish(parsedQuestions);
      }
    },
    [onScrapeFinish],
  );

  const { status, logs, questions } = useScraper(
    hasConfirmedWarning && hasQuestionsOnPage,
    handleScrapeFinish,
    initialSession?.questions,
  );

  const [outputFormat, setOutputFormat] = useState<"standard" | "ai">(
    "standard",
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const getOutputText = () => {
    if (outputFormat === "ai") {
      return formatForAI(questions);
    }
    return formatQuizData(questions);
  };

  const handleCopy = () => {
    let text = "";
    if (activeMainTab === "parse-test") {
      text = getOutputText();
    } else if (activeSubTab === "json-output" && aiAnswers) {
      text = JSON.stringify(aiAnswers, null, 2);
    }

    if (!text) return;

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

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    saveSession({ isCollapsed: next });
  };

  const handleTogglePosition = () => {
    const next = uiPosition === "right" ? "left" : "right";
    setUiPosition(next);
    saveSession({ uiPosition: next });
  };

  const handleConfirmWarning = () => {
    setHasConfirmedWarning(true);
    saveSession({ hasConfirmedWarning: true });
  };

  const handleMainTabChange = (tab: "parse-test" | "import-answers") => {
    setActiveMainTab(tab);
    saveSession({ activeMainTab: tab });
  };

  const handleSubTabChange = (tab: "json-output" | "current-questions") => {
    setActiveSubTab(tab);
    saveSession({ activeSubTab: tab });
  };

  const handleAnswersImport = useCallback((answers: AiAnswers) => {
    setAiAnswers(answers);
    setActiveSubTab("current-questions");
    saveSession({
      aiAnswers: answers,
      activeSubTab: "current-questions",
    });
  }, []);

  const handleResetAnswers = useCallback(() => {
    setAiAnswers(null);
    saveSession({ aiAnswers: null });
    clearSession();
  }, []);

  // Full height when content is available
  const shouldExpand =
    (activeMainTab === "parse-test" &&
      hasConfirmedWarning &&
      hasQuestionsOnPage) ||
    (activeMainTab === "import-answers" &&
      aiAnswers !== null &&
      hasQuestionsOnPage);

  // Show footer when output or answers are ready
  const showFooter =
    !isCollapsed &&
    ((activeMainTab === "parse-test" && status === "completed") ||
      (activeMainTab === "import-answers" && aiAnswers !== null));

  return (
    <div
      className={`fixed top-3 w-[420px] bg-slate-900 rounded-xl shadow-2xl flex flex-col font-sans text-slate-100 z-[99999] overflow-hidden ${
        uiPosition === "left" ? "left-3" : "right-3"
      }`}
      style={{
        border: "1px solid #64748b",
        ...(isCollapsed
          ? {}
          : shouldExpand
            ? { height: "85vh" }
            : { height: "auto" }),
      }}
    >
      <OverlayHeader
        status={activeMainTab === "parse-test" ? status : "completed"}
        onClose={onClose}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        uiPosition={uiPosition}
        onTogglePosition={handleTogglePosition}
      />

      {!isCollapsed && hasQuestionsOnPage && (
        <div className="flex bg-slate-950/40 border-b border-slate-900 shrink-0">
          <button
            onClick={() => handleMainTabChange("parse-test")}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer select-none text-center ${
              activeMainTab === "parse-test"
                ? "bg-slate-900/40 text-indigo-400 font-extrabold border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Parse Test
          </button>
          <button
            onClick={() => handleMainTabChange("import-answers")}
            className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer select-none text-center ${
              activeMainTab === "import-answers"
                ? "bg-slate-900/40 text-indigo-400 font-extrabold border-b-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Import AI Answers
          </button>
        </div>
      )}

      {!isCollapsed && (
        <div className="flex-1 p-4 overflow-y-auto flex flex-col min-h-0">
          {!hasQuestionsOnPage ? (
            <div className="flex flex-col gap-4 min-h-0">
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
          ) : activeMainTab === "parse-test" ? (
            // ================== PARSE TEST MODE ==================
            !hasConfirmedWarning ? (
              <div className="p-1 flex flex-col gap-4 min-h-0">
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
                    This will lock you out of all previous questions and result
                    in a 0 grade for them.
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
                    onClick={handleConfirmWarning}
                    className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer text-center"
                  >
                    Proceed
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                {status !== "completed" && (
                  <LogsTerminal logs={logs} status={status} />
                )}

                {status === "completed" && (
                  <OutputViewer
                    questions={questions}
                    outputFormat={outputFormat}
                    onChangeFormat={setOutputFormat}
                    outputText={getOutputText()}
                  />
                )}
              </div>
            )
          ) : (
            // ================== IMPORT AI ANSWERS MODE ==================
            <div className="flex-1 flex flex-col min-h-0">
              {aiAnswers === null ? (
                <AnswersImporter onAnswersImport={handleAnswersImport} />
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Header row: Title and sub-tabs inline on the same row */}
                  <div className="flex items-center justify-between mb-3 shrink-0 select-none">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1">
                      {activeSubTab === "current-questions"
                        ? `Active Page Questions (${activeQuestionsCount})`
                        : `Raw JSON (${Object.keys(aiAnswers).length})`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSubTabChange("current-questions")}
                        className={`text-[11px] px-3 py-1 rounded-lg transition cursor-pointer select-none font-bold ${
                          activeSubTab === "current-questions"
                            ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-slate-950/40 text-slate-400 border border-slate-800/60 hover:text-slate-200"
                        }`}
                      >
                        Questions
                      </button>
                      <button
                        onClick={() => handleSubTabChange("json-output")}
                        className={`text-[11px] px-3 py-1 rounded-lg transition cursor-pointer select-none font-bold ${
                          activeSubTab === "json-output"
                            ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-slate-950/40 text-slate-400 border border-slate-800/60 hover:text-slate-200"
                        }`}
                      >
                        Raw JSON
                      </button>
                    </div>
                  </div>

                  {activeSubTab === "json-output" ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      <textarea
                        readOnly
                        value={JSON.stringify(aiAnswers, null, 2)}
                        className="flex-1 w-full bg-[#0a1024] border border-slate-800/80 rounded-lg p-3 font-mono text-[10px] text-slate-300 resize-none focus:outline-none min-h-[120px]"
                      />
                      <button
                        onClick={handleResetAnswers}
                        className="mt-3 w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition cursor-pointer select-none text-center"
                      >
                        Reset & Import New
                      </button>
                    </div>
                  ) : (
                    <CurrentQuestionsView answers={aiAnswers} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showFooter && (
        <OverlayFooter
          onCopy={handleCopy}
          copyFeedback={copyFeedback}
          showCopyButton={
            activeMainTab === "parse-test" ||
            (activeMainTab === "import-answers" &&
              activeSubTab === "json-output")
          }
          showAutoSelect={activeMainTab === "import-answers"}
          autoSelect={autoSelect}
          onToggleAutoSelect={(val) => {
            setAutoSelect(val);
            saveSession({ autoSelect: val });
          }}
        />
      )}
    </div>
  );
};
