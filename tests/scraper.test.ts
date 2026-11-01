import { afterEach, describe, expect, it, vi } from "vitest";
import { getPageNumbers, runScraper } from "../src/core/scraper";
import { parseFixture, readFixture } from "./helpers";

const ATTEMPT_URL =
  "https://dl.nure.ua/mod/quiz/attempt.php?attempt=13&cmid=804222";

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getPageNumbers", () => {
  it("reads pages from data-quiz-page, not from the question count", () => {
    // 40 questions spread over 10 pages
    const doc = parseFixture("pvit-page-1.html");
    expect(doc.querySelectorAll(".qnbutton")).toHaveLength(40);
    expect(getPageNumbers(doc)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("falls back to the page parameter of the button link", () => {
    expect(getPageNumbers(parseFixture("other-types.html"))).toEqual([0, 1, 2]);
  });
});

describe("runScraper", () => {
  it("fetches each page once and returns every question once", async () => {
    const pages = [
      readFixture("pvit-page-1.html"),
      readFixture("pvit-page-2.html"),
    ];
    const fetchMock = vi.fn(async (url: string) => {
      const page = Number(new URL(url).searchParams.get("page"));
      // Moodle clamps out-of-range pages to the last one
      return htmlResponse(pages[Math.min(page, pages.length - 1)]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await runScraper(
      ATTEMPT_URL,
      parseFixture("pvit-page-1.html"),
    );

    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(fetchMock.mock.calls[3][0]).toContain("page=3");
    expect(fetchMock.mock.calls[3][0]).toContain("attempt=13");
    expect(result.questions).toHaveLength(8);
    expect(result.questions.map((q) => q.index)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(result.failedPages).toEqual([]);
  });

  it("reports failed pages and an expired session", async () => {
    const page1 = readFixture("pvit-page-1.html");
    const login =
      '<html><body id="page-login-index"><form action="https://dl.nure.ua/login/index.php"></form></body></html>';
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const page = new URL(url).searchParams.get("page");
        if (page === "0") return htmlResponse(page1);
        if (page === "1") return htmlResponse("", 503);
        return htmlResponse(login);
      }),
    );
    const logs: string[] = [];

    const result = await runScraper(
      ATTEMPT_URL,
      parseFixture("pvit-page-1.html"),
      {
        onLog: (log) => logs.push(log),
      },
    );

    expect(result.questions).toHaveLength(4);
    expect(result.failedPages).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(logs.some((l) => l.includes("status: 503"))).toBe(true);
    expect(logs.some((l) => l.includes("session has expired"))).toBe(true);
  });
});
