import fs from "fs";
import path from "path";

export function readFixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
}

export function parseFixture(name: string): Document {
  return new DOMParser().parseFromString(readFixture(name), "text/html");
}

/** Loads a fixture into the live jsdom document, like a Moodle page the content script runs on. */
export function loadFixtureIntoDocument(name: string): void {
  const doc = parseFixture(name);
  document.body.innerHTML = doc.body.innerHTML;
}

export function checkedLabels(block: Element): string[] {
  return Array.from(block.querySelectorAll<HTMLInputElement>(".answer input"))
    .filter((input) => input.checked)
    .map((input) => {
      const label = block.querySelector(
        `[id="${input.getAttribute("aria-labelledby")}"] .flex-fill`,
      );
      return label?.textContent?.trim() ?? "";
    });
}

/** In-memory stand-in for chrome.storage.local. */
export function installChromeStorageMock(): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const local = {
    get: async (keys: string | string[] | null) => {
      if (keys === null) return { ...data };
      const list = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(
        list.filter((k) => k in data).map((k) => [k, structuredClone(data[k])]),
      );
    },
    set: async (items: Record<string, unknown>) => {
      Object.assign(data, structuredClone(items));
    },
    remove: async (keys: string | string[]) => {
      for (const k of Array.isArray(keys) ? keys : [keys]) delete data[k];
    },
  };
  (globalThis as unknown as { chrome: unknown }).chrome = {
    storage: { local },
  };
  return data;
}
