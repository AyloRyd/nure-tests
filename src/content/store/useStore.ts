import { create } from "zustand";
import type { Question, AiAnswers } from "../../types";
import { saveSession, clearSession } from "../../core/storage";
import type { StoredSession } from "../../core/storage";

interface StoreState {
  activeMainTab: "parse-test" | "import-answers";
  activeSubTab: "json-output" | "current-questions";
  hasConfirmedWarning: boolean;
  aiAnswers: AiAnswers | null;
  isCollapsed: boolean;
  uiPosition: "left" | "right";
  autoSelect: boolean;
  outputFormat: "standard" | "ai";
  copyFeedback: string | null;
  questions: Question[];

  initialize: (session: StoredSession | null) => void;
  setActiveMainTab: (tab: "parse-test" | "import-answers") => void;
  setActiveSubTab: (tab: "json-output" | "current-questions") => void;
  setHasConfirmedWarning: (confirmed: boolean) => void;
  setAiAnswers: (answers: AiAnswers | null) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  setUiPosition: (position: "left" | "right") => void;
  setAutoSelect: (autoSelect: boolean) => void;
  setOutputFormat: (format: "standard" | "ai") => void;
  setCopyFeedback: (feedback: string | null) => void;
  setQuestions: (questions: Question[]) => void;
  resetAnswers: () => void;
  resetAllState: () => void;
}

export const useStore = create<StoreState>((set) => ({
  activeMainTab: "parse-test",
  activeSubTab: "current-questions",
  hasConfirmedWarning: false,
  aiAnswers: null,
  isCollapsed: false,
  uiPosition: "right",
  autoSelect: true,
  outputFormat: "standard",
  copyFeedback: null,
  questions: [],

  initialize: (session) => {
    if (session) {
      set({
        activeMainTab: session.activeMainTab || "parse-test",
        activeSubTab: session.activeSubTab || "current-questions",
        hasConfirmedWarning: session.hasConfirmedWarning || false,
        aiAnswers: session.aiAnswers || null,
        isCollapsed: session.isCollapsed || false,
        uiPosition: session.uiPosition || "right",
        autoSelect: session.autoSelect ?? true,
        questions: session.questions || [],
      });
    }
  },

  setActiveMainTab: (tab) => {
    set({ activeMainTab: tab });
    saveSession({ activeMainTab: tab });
  },

  setActiveSubTab: (tab) => {
    set({ activeSubTab: tab });
    saveSession({ activeSubTab: tab });
  },

  setHasConfirmedWarning: (confirmed) => {
    set({ hasConfirmedWarning: confirmed });
    saveSession({ hasConfirmedWarning: confirmed });
  },

  setAiAnswers: (answers) => {
    set({ aiAnswers: answers });
    saveSession({ aiAnswers: answers });
  },

  setIsCollapsed: (collapsed) => {
    set({ isCollapsed: collapsed });
    saveSession({ isCollapsed: collapsed });
  },

  setUiPosition: (position) => {
    set({ uiPosition: position });
    saveSession({ uiPosition: position });
  },

  setAutoSelect: (autoSelect) => {
    set({ autoSelect });
    saveSession({ autoSelect });
  },

  setOutputFormat: (format) => {
    set({ outputFormat: format });
  },

  setCopyFeedback: (feedback) => {
    set({ copyFeedback: feedback });
  },

  setQuestions: (questions) => {
    set({ questions });
    saveSession({ questions });
  },

  resetAnswers: () => {
    set({ aiAnswers: null });
    saveSession({ aiAnswers: null });
    clearSession();
  },

  resetAllState: () => {
    set({
      activeMainTab: "parse-test",
      activeSubTab: "current-questions",
      hasConfirmedWarning: false,
      aiAnswers: null,
      isCollapsed: false,
      uiPosition: "right",
      autoSelect: true,
      outputFormat: "standard",
      copyFeedback: null,
      questions: [],
    });
    clearSession();
  },
}));
