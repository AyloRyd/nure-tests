import { useState, useEffect, useMemo, useCallback } from "react";
import type { AnswerType, AiAnswers } from "../../types";
import { getAnswersType, normalizeForMatch } from "../../core/parser";
import {
  createAnswerLookup,
  getQuestionBlockText,
  selectAnswersForQuestion,
} from "../utils/AnswerSelector";

interface VisibleQuestion {
  key: string;
  element: Element;
  text: string;
  type: AnswerType;
  index: number;
  correctList: string[] | null;
}

interface ScannedQuestion {
  key: string;
  element: Element;
  text: string;
  type: AnswerType;
  index: number;
}

function scanVisibleQuestions(): ScannedQuestion[] {
  const list: ScannedQuestion[] = [];
  document.querySelectorAll(".que").forEach((block, idx) => {
    const text = getQuestionBlockText(block);
    if (text === null) return;
    const qno = block.querySelector(".qno")?.textContent?.trim();
    list.push({
      key: block.id || `${idx}:${text}`,
      element: block,
      text,
      type: getAnswersType(block),
      index: qno && /^\d+$/.test(qno) ? Number(qno) : idx + 1,
    });
  });
  return list;
}

function sameQuestions(a: ScannedQuestion[], b: ScannedQuestion[]): boolean {
  return (
    a.length === b.length &&
    a.every((q, i) => q.element === b[i].element && q.text === b[i].text)
  );
}

export function useCurrentQuestions(answers: AiAnswers | null) {
  const [scanned, setScanned] =
    useState<ScannedQuestion[]>(scanVisibleQuestions);
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSet, setAppliedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let frame = 0;
    const rescan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = scanVisibleQuestions();
        // Moodle's timer mutates the DOM every second; skip no-op updates
        setScanned((prev) => (sameQuestions(prev, next) ? prev : next));
      });
    };

    const target = document.getElementById("responseform") ?? document.body;
    const observer = new MutationObserver(rescan);
    observer.observe(target, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const lookup = useMemo(
    () => (answers ? createAnswerLookup(answers) : null),
    [answers],
  );

  const visibleQuestions: VisibleQuestion[] = useMemo(
    () =>
      scanned.map((q) => ({
        ...q,
        correctList: lookup?.(q.text) ?? null,
      })),
    [scanned, lookup],
  );

  const handleApplyGlow = useCallback(
    (
      key: string,
      element: Element,
      correctList: string[],
      type: AnswerType,
    ) => {
      selectAnswersForQuestion(element, correctList, type);
      setAppliedSet((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    },
    [],
  );

  const allImportedQuestions = useMemo(() => {
    if (!answers) return [];
    const onPage = new Set(scanned.map((q) => normalizeForMatch(q.text)));
    return Object.keys(answers)
      .filter((text) => !onPage.has(normalizeForMatch(text)))
      .map((text) => ({
        text,
        correctList: answers[text],
      }));
  }, [answers, scanned]);

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
  };
}

export function formatType(type: AnswerType): string {
  switch (type) {
    case "single":
      return "Single Choice";
    case "multiple":
      return "Multiple Choice";
    case "short":
      return "Written Answer";
    case "select":
      return "Dropdown Select";
    default:
      return "Unsupported";
  }
}
