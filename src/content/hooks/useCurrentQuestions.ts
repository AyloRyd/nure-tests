import { useState, useEffect, useMemo, useCallback } from "react";
import type { AnswerType, AiAnswers } from "../../types";
import { cleanQuestionText } from "../../core/parser";
import { selectAnswersForQuestion } from "../utils/AnswerSelector";

interface VisibleQuestion {
  element: Element;
  text: string;
  type: AnswerType;
  index: number;
}

export function useCurrentQuestions(answers: AiAnswers | null) {
  const [visibleQuestions, setVisibleQuestions] = useState<VisibleQuestion[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSet, setAppliedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const scanVisibleQuestions = () => {
      const blocks = document.querySelectorAll(".que");
      const list: VisibleQuestion[] = [];

      blocks.forEach((block, idx) => {
        const qtextEl = block.querySelector(".qtext");
        if (qtextEl) {
          const text = cleanQuestionText(qtextEl.textContent || "");

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

  const visibleMap = useMemo(() => {
    const map = new Map<string, VisibleQuestion>();
    visibleQuestions.forEach((q) => {
      map.set(q.text, q);
    });
    return map;
  }, [visibleQuestions]);

  const handleApplyGlow = useCallback(
    (
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
    },
    [],
  );

  const formatType = useCallback((type: AnswerType): string => {
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
  }, []);

  const allImportedQuestions = useMemo(() => {
    if (!answers) return [];
    return Object.keys(answers)
      .filter((text) => !visibleMap.has(text))
      .map((text) => ({
        text,
        correctList: answers[text],
      }));
  }, [answers, visibleMap]);

  const filteredImportedQuestions = useMemo(() => {
    if (!searchQuery.trim()) return allImportedQuestions;
    const q = searchQuery.toLowerCase();
    return allImportedQuestions.filter(
      (item) =>
        item.text.toLowerCase().includes(q) ||
        item.correctList.some((ans) => ans.toLowerCase().includes(q)),
    );
  }, [allImportedQuestions, searchQuery]);

  return {
    visibleQuestions,
    searchQuery,
    setSearchQuery,
    appliedSet,
    filteredImportedQuestions,
    allImportedQuestions,
    handleApplyGlow,
    formatType,
  };
}
