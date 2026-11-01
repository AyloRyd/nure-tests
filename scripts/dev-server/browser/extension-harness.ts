/// <reference lib="dom" />

type Store = Record<string, unknown>;
type MessageListener = (
  message: { action: string },
  sender: object,
  sendResponse: () => void,
) => void;

interface HarnessWindow {
  chrome?: Record<string, unknown>;
  __nuretestsOpen?: () => void;
}

/**
 * A tiny `chrome.*` stand-in, so the built content script can run in a mock
 * page in any browser without installing the extension. Storage lives in
 * localStorage.
 *
 * Runs in the browser. It is injected into the page with `toString()`, so it
 * must stay self-contained: no imports and no references to anything outside
 * the function body (types are fine, Node strips them).
 */
export function extensionHarness() {
  const STORE_KEY = "__nuretests_harness_storage";
  const read = (): Store => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch {
      return {};
    }
  };
  const write = (data: Store) =>
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  const toList = (keys: string | string[]) =>
    Array.isArray(keys) ? keys : [keys];

  const listeners: MessageListener[] = [];
  const w = window as unknown as HarnessWindow;

  w.chrome = w.chrome || {};
  w.chrome.runtime = {
    getURL: (p: string) => "/__ext/" + p,
    onMessage: { addListener: (fn: MessageListener) => listeners.push(fn) },
  };
  w.chrome.storage = {
    local: {
      get: async (keys?: string | string[] | null) => {
        const data = read();
        if (keys == null) return data;
        return Object.fromEntries(
          toList(keys)
            .filter((k) => k in data)
            .map((k) => [k, data[k]]),
        );
      },
      set: async (items: Store) => write({ ...read(), ...items }),
      remove: async (keys: string | string[]) => {
        const data = read();
        for (const k of toList(keys)) delete data[k];
        write(data);
      },
    },
  };

  // Same as clicking "Parse" in the popup
  w.__nuretestsOpen = () =>
    listeners.forEach((fn) => fn({ action: "runParser" }, {}, () => {}));
  window.addEventListener("load", () => setTimeout(w.__nuretestsOpen!, 300));
}
