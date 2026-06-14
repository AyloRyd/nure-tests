import type { AiAnswers, Question } from "../types";

const STORAGE_KEY = "nuretests_session";

export interface StoredSession {
  attemptId: string;
  isOpen: boolean;
  isCollapsed: boolean;
  activeMainTab: "parse-test" | "import-answers";
  activeSubTab: "json-output" | "current-questions";
  hasConfirmedWarning: boolean;
  questions: Question[];
  aiAnswers: AiAnswers | null;
  uiPosition: "left" | "right";
  autoSelect: boolean;
  timestamp: number;
}

/** Extract Moodle attempt ID from the current page URL. */
export function getAttemptId(): string | null {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get("attempt");
  } catch {
    return null;
  }
}

/** Load the persisted session state for the current Moodle quiz attempt. */
export async function loadSession(): Promise<StoredSession | null> {
  const attemptId = getAttemptId();
  if (!attemptId) return null;

  try {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    const session = result[STORAGE_KEY] as StoredSession | undefined;
    if (session && session.attemptId === attemptId) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

let saveQueue: Promise<void> = Promise.resolve();

/** Save/merge session state for the current Moodle quiz attempt. */
export async function saveSession(
  updates: Partial<Omit<StoredSession, "attemptId" | "timestamp">>,
): Promise<void> {
  saveQueue = saveQueue.then(async () => {
    const attemptId = getAttemptId();
    if (!attemptId) return;

    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const existing = (result[STORAGE_KEY] || {}) as Partial<StoredSession>;

      const base = existing.attemptId === attemptId ? existing : {};

      const updated: StoredSession = {
        attemptId,
        isOpen: base.isOpen ?? false,
        isCollapsed: base.isCollapsed ?? false,
        activeMainTab: base.activeMainTab ?? "parse-test",
        activeSubTab: base.activeSubTab ?? "current-questions",
        hasConfirmedWarning: base.hasConfirmedWarning ?? false,
        questions: base.questions ?? [],
        aiAnswers: base.aiAnswers ?? null,
        uiPosition: base.uiPosition ?? "right",
        autoSelect: base.autoSelect ?? true,
        ...updates,
        timestamp: Date.now(),
      };

      await chrome.storage.local.set({ [STORAGE_KEY]: updated });
    } catch (err) {
      console.error("Failed to save session state:", err);
    }
  });

  return saveQueue;
}

/** Clear the persisted session. */
export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
