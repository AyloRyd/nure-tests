import React from "react";
import { NavigationTabs } from "./NavigationTabs";
import { NoQuestionsView } from "./NoQuestionsView";
import { WarningView } from "./WarningView";
import { LogsTerminal } from "./LogsTerminal";
import { OutputViewer } from "./OutputViewer";
import { AnswersImporter } from "./AnswersImporter";
import { CurrentQuestionsView } from "./CurrentQuestionsView";
import type { useOverlay } from "../hooks/useOverlay";

interface OverlayContentProps {
  state: ReturnType<typeof useOverlay>;
  onClose: () => void;
}

export const OverlayContent: React.FC<OverlayContentProps> = ({
  state,
  onClose,
}) => {
  const {
    activeMainTab,
    activeSubTab,
    hasConfirmedWarning,
    aiAnswers,
    isCollapsed,
    status,
    logs,
    hasQuestionsOnPage,
    activeQuestionsCount,
    handleConfirmWarning,
    handleAnswersImport,
    resetAnswers,
    getOutputText,
    setActiveSubTab,
    setOutputFormat,
  } = state;

  if (isCollapsed) return null;

  return (
    <>
      {hasQuestionsOnPage && (
        <NavigationTabs
          activeTab={activeMainTab}
          onChangeTab={state.setActiveMainTab}
        />
      )}

      <div className="flex-grow p-4 overflow-y-auto flex flex-col min-h-0">
        {!hasQuestionsOnPage ? (
          <NoQuestionsView onClose={onClose} />
        ) : activeMainTab === "parse-test" ? (
          !hasConfirmedWarning ? (
            <WarningView onClose={onClose} onConfirm={handleConfirmWarning} />
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {status !== "completed" && (
                <LogsTerminal logs={logs} status={status} />
              )}

              {status === "completed" && (
                <OutputViewer
                  questions={state.questions}
                  outputFormat={state.outputFormat}
                  onChangeFormat={setOutputFormat}
                  outputText={getOutputText()}
                />
              )}
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {aiAnswers === null ? (
              <AnswersImporter onAnswersImport={handleAnswersImport} />
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0 select-none">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-1">
                    {activeSubTab === "current-questions"
                      ? `Active Page Questions (${activeQuestionsCount})`
                      : `Raw JSON (${Object.keys(aiAnswers).length})`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveSubTab("current-questions")}
                      className={`text-[11px] px-3 py-1 rounded-lg transition cursor-pointer select-none font-bold ${
                        activeSubTab === "current-questions"
                          ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                          : "bg-slate-950/40 text-slate-400 border border-slate-800/60 hover:text-slate-200"
                      }`}
                    >
                      Questions
                    </button>
                    <button
                      onClick={() => setActiveSubTab("json-output")}
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
                      onClick={resetAnswers}
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
    </>
  );
};
