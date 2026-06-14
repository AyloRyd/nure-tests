import { useCallback, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useScraper } from "./useScraper";
import { formatQuizData, formatForAI } from "../../core/formatter";
import type { Question, AiAnswers } from "../../types";
import { autoSelectAllVisibleQuestions } from "../utils/AnswerSelector";

export function useOverlay() {
  const {
    activeMainTab,
    activeSubTab,
    hasConfirmedWarning,
    aiAnswers,
    isCollapsed,
    uiPosition,
    autoSelect,
    outputFormat,
    copyFeedback,
    questions,
    initialize,
    setActiveMainTab,
    setActiveSubTab,
    setHasConfirmedWarning,
    setAiAnswers,
    setIsCollapsed,
    setUiPosition,
    setAutoSelect,
    setOutputFormat,
    setCopyFeedback,
    setQuestions,
    resetAnswers,
  } = useStore();

  const hasQuestionsOnPage =
    document.querySelectorAll(".qnbutton, .que").length > 0;
  const activeQuestionsCount = document.querySelectorAll(".que").length;

  useEffect(() => {
    if (aiAnswers && autoSelect) {
      autoSelectAllVisibleQuestions(aiAnswers);
    }
  }, [aiAnswers, autoSelect]);

  const handleScrapeFinish = useCallback(
    (parsedQuestions: Question[]) => {
      setQuestions(parsedQuestions);
    },
    [setQuestions],
  );

  const {
    status,
    logs,
    questions: scrapedQuestions,
  } = useScraper(
    hasConfirmedWarning && hasQuestionsOnPage,
    handleScrapeFinish,
    questions,
  );

  const getOutputText = useCallback(() => {
    if (outputFormat === "ai") {
      return formatForAI(scrapedQuestions);
    }
    return formatQuizData(scrapedQuestions);
  }, [outputFormat, scrapedQuestions]);

  const handleCopy = useCallback(() => {
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
      .catch((err) => {
        console.error("Clipboard copy failed:", err);
      });
  }, [activeMainTab, activeSubTab, aiAnswers, getOutputText, setCopyFeedback]);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  const handleTogglePosition = useCallback(() => {
    setUiPosition(uiPosition === "right" ? "left" : "right");
  }, [uiPosition, setUiPosition]);

  const handleConfirmWarning = useCallback(() => {
    setHasConfirmedWarning(true);
  }, [setHasConfirmedWarning]);

  const handleAnswersImport = useCallback(
    (answers: AiAnswers) => {
      setAiAnswers(answers);
      setActiveSubTab("current-questions");
    },
    [setAiAnswers, setActiveSubTab],
  );

  const shouldExpand =
    (activeMainTab === "parse-test" &&
      hasConfirmedWarning &&
      hasQuestionsOnPage) ||
    (activeMainTab === "import-answers" &&
      aiAnswers !== null &&
      hasQuestionsOnPage);

  const showFooter =
    !isCollapsed &&
    ((activeMainTab === "parse-test" && status === "completed") ||
      (activeMainTab === "import-answers" && aiAnswers !== null));

  return {
    activeMainTab,
    activeSubTab,
    hasConfirmedWarning,
    aiAnswers,
    isCollapsed,
    uiPosition,
    autoSelect,
    outputFormat,
    copyFeedback,
    questions: scrapedQuestions,
    status,
    logs,
    hasQuestionsOnPage,
    activeQuestionsCount,
    shouldExpand,
    showFooter,
    initialize,
    setActiveMainTab,
    setActiveSubTab,
    setAutoSelect,
    setOutputFormat,
    handleCopy,
    handleToggleCollapse,
    handleTogglePosition,
    handleConfirmWarning,
    handleAnswersImport,
    resetAnswers,
    getOutputText,
  };
}
