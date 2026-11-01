import { beforeEach, describe, expect, it } from "vitest";
import { clearSession, loadSession, saveSession } from "../src/core/storage";
import { useStore } from "../src/content/store/useStore";
import { installChromeStorageMock } from "./helpers";

function openAttempt(id: string) {
  window.history.replaceState(
    null,
    "",
    `/mod/quiz/attempt.php?attempt=${id}&page=0`,
  );
}

let data: Record<string, unknown>;

beforeEach(() => {
  data = installChromeStorageMock();
  openAttempt("1");
});

describe("session storage", () => {
  it("keeps each attempt separately", async () => {
    await saveSession({ aiAnswers: { q: ["a"] } });
    openAttempt("2");
    await saveSession({ aiAnswers: { other: ["b"] } });

    expect((await loadSession())?.aiAnswers).toEqual({ other: ["b"] });
    openAttempt("1");
    expect((await loadSession())?.aiAnswers).toEqual({ q: ["a"] });
  });

  it("applies a clear and a following save in order", async () => {
    await saveSession({ uiPosition: "left" });
    clearSession();
    await saveSession({ isOpen: true });

    const session = await loadSession();
    expect(session?.isOpen).toBe(true);
    expect(session?.uiPosition).toBe("right");
  });

  it("drops the old single-key session", async () => {
    data["nuretests_session"] = { attemptId: "1" };
    await loadSession();
    await new Promise((r) => setTimeout(r, 0));
    expect(data).not.toHaveProperty("nuretests_session");
  });
});

describe("store resets", () => {
  it("'Reset & Import New' only forgets the answers", async () => {
    const store = useStore.getState();
    store.setQuestions([
      { index: 1, text: "q", type: "single", answers: ["a"] },
    ]);
    store.setAiAnswers({ q: ["a"] });
    await saveSession({ isOpen: true });

    useStore.getState().resetAnswers();
    const session = await loadSession();

    expect(session?.aiAnswers).toBeNull();
    expect(session?.questions).toHaveLength(1);
    expect(session?.isOpen).toBe(true);
  });

  it("a fresh start keeps the overlay open after reload", async () => {
    useStore.getState().setAiAnswers({ q: ["a"] });
    useStore.getState().resetAllState();
    const session = await loadSession();

    expect(session?.isOpen).toBe(true);
    expect(session?.aiAnswers).toBeNull();
  });
});
