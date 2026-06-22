import React from "react";
import type { AiAnswers } from "../../types";
import { useCurrentQuestions } from "../hooks/useCurrentQuestions";
import { Search } from "lucide-react";

interface CurrentQuestionsViewProps {
  answers: AiAnswers | null;
}

export const CurrentQuestionsView: React.FC<CurrentQuestionsViewProps> = ({
  answers,
}) => {
  const {
    visibleQuestions,
    searchQuery,
    setSearchQuery,
    appliedSet,
    filteredImportedQuestions,
    allImportedQuestions,
    handleApplyGlow,
    formatType,
  } = useCurrentQuestions(answers);

  return (
    <div className="flex-grow flex flex-col gap-3 text-left pb-4">
      <div className="flex flex-col gap-2">
        {visibleQuestions.length === 0 ? (
          <div className="p-3 bg-slate-950/20 rounded-lg border border-slate-800/40 text-center">
            <p className="text-xs text-slate-500">
              No questions found on this page. Navigate to a Moodle quiz attempt
              page.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleQuestions.map((q) => {
              const correctList = answers ? answers[q.text] : null;
              const wasApplied = appliedSet.has(q.text);

              return (
                <div
                  key={q.text}
                  className="bg-[#0a1024] border border-slate-800/80 rounded-lg p-3 flex flex-col gap-2 transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-2 shrink-0 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                        Q#{q.index}
                      </span>
                      <span className="text-[9px] bg-slate-800/50 text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded font-semibold">
                        {formatType(q.type)}
                      </span>
                    </div>

                    {correctList && (
                      <button
                        onClick={() =>
                          handleApplyGlow(
                            q.text,
                            q.element,
                            correctList,
                            q.type,
                          )
                        }
                        className={`text-[9px] px-2 py-1 rounded-lg font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                          wasApplied
                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-600/20"
                        }`}
                      >
                        {wasApplied ? "Applied" : "Apply"}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-200 font-medium leading-snug break-words">
                    {q.text}
                  </p>

                  {correctList ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 mt-1">
                      <div className="text-[11px] text-emerald-400 font-semibold leading-relaxed">
                        <span className="text-slate-400 font-normal">
                          Answer:{" "}
                        </span>
                        {q.type === "ShortAnswer"
                          ? `"${correctList[0]}"`
                          : correctList.join(", ")}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 italic block mt-1">
                      No answer imported yet
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {answers && (
        <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-800/40">
          <div className="flex flex-col gap-2 px-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
              All Imported Questions ({allImportedQuestions.length})
            </span>

            <div className="relative flex items-center w-full">
              <span className="absolute left-2.5 text-slate-500 flex items-center pointer-events-none">
                <Search size={12} />
              </span>
              <input
                type="text"
                placeholder="Search questions or answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/40 border border-slate-800/80 rounded-lg text-xs py-1.5 pl-8 pr-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            {filteredImportedQuestions.length === 0 ? (
              <div className="p-3 bg-slate-950/10 rounded-lg border border-slate-800/30 text-center">
                <p className="text-xs text-slate-500">
                  No matching questions found.
                </p>
              </div>
            ) : (
              filteredImportedQuestions.map((item, idx) => {
                return (
                  <div
                    key={idx}
                    className="bg-[#0a1024] border border-slate-800/80 rounded-lg p-3 flex flex-col gap-2 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2 shrink-0 select-none">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] bg-slate-800/50 text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded font-mono font-bold">
                          Q#{idx + 1}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-200 font-medium leading-snug break-words">
                      {item.text}
                    </p>

                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 mt-1">
                      <div className="text-[11px] text-emerald-400 font-semibold leading-relaxed">
                        <span className="text-slate-400 font-normal">
                          Answer:{" "}
                        </span>
                        {item.correctList.join(", ")}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
