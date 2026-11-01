import type { AiAnswers, Question } from "../types";

const STORAGE_PREFIX = "nuretests_session_";
const LEGACY_STORAGE_KEY = "nuretests_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

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

function storageKey(attemptId: string): string {
  return `${STORAGE_PREFIX}${attemptId}`;
}

/** Drop sessions of old attempts so storage doesn't grow forever. */
async function pruneOldSessions(): Promise<void> {
  const all = await chrome.storage.local.get(null);
  const now = Date.now();
  const stale = Object.entries(all)
    .filter(
      ([key, value]) =>
        key === LEGACY_STORAGE_KEY ||
        (key.startsWith(STORAGE_PREFIX) &&
          now - ((value as StoredSession)?.timestamp ?? 0) > SESSION_TTL_MS),
    )
    .map(([key]) => key);
  if (stale.length > 0) await chrome.storage.local.remove(stale);
}

// Every storage write goes through this queue so a clear can't race a save
let storageQueue: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>): Promise<void> {
  storageQueue = storageQueue.then(task).catch((err) => {
    console.error("NURETests storage error:", err);
  });
  return storageQueue;
}

/** Load the persisted session state for the current Moodle quiz attempt. */
export async function loadSession(): Promise<StoredSession | null> {
  const attemptId = getAttemptId();
  if (!attemptId) return null;

  try {
    await storageQueue;
    pruneOldSessions().catch(() => {});
    const key = storageKey(attemptId);
    const result = await chrome.storage.local.get(key);
    return (result[key] as StoredSession | undefined) ?? null;
  } catch {
    return null;
  }
}

/** Save/merge session state for the current Moodle quiz attempt. */
export function saveSession(
  updates: Partial<Omit<StoredSession, "attemptId" | "timestamp">>,
): Promise<void> {
  return enqueue(async () => {
    const attemptId = getAttemptId();
    if (!attemptId) return;

    const key = storageKey(attemptId);
    const result = await chrome.storage.local.get(key);
    const base = (result[key] || {}) as Partial<StoredSession>;

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

    await chrome.storage.local.set({ [key]: updated });
  });
}

/** Clear the persisted session of the current attempt. */
export function clearSession(): Promise<void> {
  return enqueue(async () => {
    const attemptId = getAttemptId();
    if (!attemptId) return;
    await chrome.storage.local.remove(storageKey(attemptId));
  });
}
