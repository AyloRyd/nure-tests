import React, { useEffect, useState, useMemo } from "react";
import type { AnswerType, AiAnswers } from "../../types";
import { cleanQuestionText } from "../../core/parser";
import { selectAnswersForQuestion } from "../utils/AnswerSelector";

interface CurrentQuestionsViewProps {
  answers: AiAnswers | null;
}

interface VisibleQuestion {
  element: Element;
  text: string;
  type: AnswerType;
  index: number;
}

export const CurrentQuestionsView: React.FC<CurrentQuestionsViewProps> = ({
  answers,
}) => {
  const [visibleQuestions, setVisibleQuestions] = useState<VisibleQuestion[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSet, setAppliedSet] = useState<Set<string>>(new Set());

  // Scan the page DOM for visible questions on mount/render
  useEffect(() => {
    const scanVisibleQuestions = () => {
      const blocks = document.querySelectorAll(".que");
      const list: VisibleQuestion[] = [];

      blocks.forEach((block, idx) => {
        const qtextEl = block.querySelector(".qtext");
        if (qtextEl) {
          const text = cleanQuestionText(qtextEl.textContent || "");

          // Determine type
          const radioInputs = block.querySelectorAll('input[type="radio"]');
          const checkboxInputs = block.querySelectorAll(
            'input[type="checkbox"]',
          );
          const textInputs = block.querySelectorAll(
            'input[type="text"], textarea',
          );
          const selectElements = block.querySelectorAll("select");

          let type: AnswerType = "Unknown";
          if (radioInputs.length > 0) type = "SingleAnswer";
          else if (checkboxInputs.length > 0) type = "MultipleAnswer";
          else if (textInputs.length > 0) type = "ShortAnswer";
          else if (selectElements.length > 0) type = "SelectAnswer";

          list.push({
            element: block,
            text,
            type,
            index: idx + 1,
          });
        }
      });

      setVisibleQuestions(list);
    };

    scanVisibleQuestions();

    const observer = new MutationObserver(scanVisibleQuestions);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  // Map to quickly check if a question text is currently visible on the page
  const visibleMap = useMemo(() => {
    const map = new Map<string, VisibleQuestion>();
    visibleQuestions.forEach((q) => {
      map.set(q.text, q);
    });
    return map;
  }, [visibleQuestions]);

  const handleApplyGlow = (
    questionText: string,
    element: Element,
    correctList: string[],
    type: AnswerType,
  ) => {
    selectAnswersForQuestion(element, correctList, type);
    setAppliedSet((prev) => {
      const next = new Set(prev);
      next.add(questionText);
      return next;
    });
  };

  // Helper to format the type string nicely
  const formatType = (type: AnswerType): string => {
    switch (type) {
      case "SingleAnswer":
        return "Single Choice";
      case "MultipleAnswer":
        return "Multiple Choice";
      case "ShortAnswer":
        return "Written Answer";
      case "SelectAnswer":
        return "Dropdown Select";
      default:
        return "Question";
    }
  };

  // List of all imported questions from the JSON answers, excluding currently visible questions
  const allImportedQuestions = useMemo(() => {
    if (!answers) return [];
    return Object.keys(answers)
      .filter((text) => !visibleMap.has(text))
      .map((text) => ({
        text,
        correctList: answers[text],
      }));
  }, [answers, visibleMap]);

  // Filtered list of imported questions based on search query
  const filteredImportedQuestions = useMemo(() => {
    if (!searchQuery.trim()) return allImportedQuestions;
    const q = searchQuery.toLowerCase();
    return allImportedQuestions.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        item.correctList.some((ans) => ans.toLowerCase().includes(q)),
    );
  }, [allImportedQuestions, searchQuery]);

  return (
    <div className="flex-grow flex flex-col gap-3 text-left">
      {/* 1. VISIBLE PAGE QUESTIONS */}
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
                  {/* Card Header: Badges & Action Button */}
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

                  {/* Question Text */}
                  <p className="text-xs text-slate-200 font-medium leading-snug break-words">
                    {q.text}
                  </p>

                  {/* Correct Answer Display */}
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

      {/* 2. ALL IMPORTED QUESTIONS WITH SEARCH */}
      {answers && (
        <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-800/40">
          <div className="flex flex-col gap-2 px-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
              All Imported Questions ({allImportedQuestions.length})
            </span>

            {/* Search Input Container */}
            <div className="relative flex items-center w-full">
              <span className="absolute left-2.5 text-slate-500 flex items-center pointer-events-none">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
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
                    {/* Card Header: Badges */}
                    <div className="flex items-center justify-between gap-2 shrink-0 select-none">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] bg-slate-800/50 text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded font-mono font-bold">
                          Q#{idx + 1}
                        </span>
                      </div>
                    </div>

                    {/* Question Text */}
                    <p className="text-xs text-slate-200 font-medium leading-snug break-words">
                      {item.text}
                    </p>

                    {/* Answer Display */}
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
