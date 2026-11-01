import type { Question } from "../types";
import { parseQuestionBlock } from "./parser";

declare const __DEV__: boolean;

export function getBaseUrlAndParams(currentUrl: string): {
  baseUrl: string;
  params: Record<string, string>;
} {
  const urlObj = new URL(currentUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  const params: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return { baseUrl, params };
}

export function generatePageUrl(
  baseUrl: string,
  params: Record<string, string>,
  pageNum: number,
): string {
  const urlObj = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });
  urlObj.searchParams.set("page", String(pageNum));
  return urlObj.toString();
}

export function getTotalQuestionsCount(doc: Document): number {
  return doc.querySelectorAll(".qnbutton").length;
}

/**
 * Zero-based page numbers of the attempt, read from the quiz navigation.
 * A page can hold several questions, so this is not the question count.
 */
export function getPageNumbers(doc: Document): number[] {
  const pages = new Set<number>();

  doc.querySelectorAll<HTMLElement>(".qnbutton").forEach((button) => {
    const fromData = button.dataset.quizPage;
    if (fromData !== undefined && /^\d+$/.test(fromData)) {
      pages.add(Number(fromData));
      return;
    }
    const href = button.getAttribute("href");
    if (href) {
      const page = new URL(href, "http://x").searchParams.get("page");
      pages.add(page !== null && /^\d+$/.test(page) ? Number(page) : 0);
    }
  });

  if (pages.size === 0) pages.add(0);
  return Array.from(pages).sort((a, b) => a - b);
}

/** True when Moodle answered with a login page instead of the attempt. */
export function isLoginPage(doc: Document): boolean {
  return (
    doc.querySelector("#login, form[action*='login/index.php']") !== null ||
    doc.body?.id === "page-login-index"
  );
}

export interface ScraperCallbacks {
  onProgress?: (processed: number, total: number) => void;
  onLog?: (log: string) => void;
  onError?: (page: number, error: string) => void;
}

export interface ScrapeResult {
  questions: Question[];
  failedPages: number[];
  totalPages: number;
}

export async function runScraper(
  currentUrl: string,
  doc: Document,
  callbacks?: ScraperCallbacks,
): Promise<ScrapeResult> {
  const { baseUrl, params } = getBaseUrlAndParams(currentUrl);
  const totalQuestions = getTotalQuestionsCount(doc);
  const pages = getPageNumbers(doc);

  callbacks?.onLog?.(
    `Found ${totalQuestions} questions on ${pages.length} pages. Starting extraction...`,
  );

  const quizData: Question[] = [];
  const failedPages: number[] = [];
  const seen = new Set<string>();

  for (const [i, pageNum] of pages.entries()) {
    const pageUrl = generatePageUrl(baseUrl, params, pageNum);
    callbacks?.onLog?.(`Processing page ${i + 1}/${pages.length}...`);

    try {
      const response = await fetch(pageUrl, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      const pageDoc = new DOMParser().parseFromString(html, "text/html");

      if (isLoginPage(pageDoc)) {
        throw new Error("Got the login page. Your Moodle session has expired");
      }

      // Snapshot real pages for the dev server; mock pages are snapshots already
      const isMockPage = new URL(pageUrl).hostname === "localhost";
      if (typeof __DEV__ !== "undefined" && __DEV__ && !isMockPage) {
        fetch("http://localhost:3010/api/save-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageNum: pageNum + 1, html, url: pageUrl }),
        }).catch((err) => {
          console.warn("[Dev Mode] Failed to save page to dev-server:", err);
        });
      }

      const questionContainers = pageDoc.querySelectorAll(".que");
      if (questionContainers.length === 0) {
        throw new Error("No questions found on this page");
      }
      questionContainers.forEach((container) => {
        // Moodle clamps out-of-range pages, so never count a question twice
        const key = container.id || container.textContent || "";
        if (seen.has(key)) return;
        seen.add(key);
        quizData.push(parseQuestionBlock(container, quizData.length + 1));
      });

      callbacks?.onProgress?.(i + 1, pages.length);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      failedPages.push(pageNum + 1);
      callbacks?.onLog?.(`Error processing page ${pageNum + 1}: ${errMsg}`);
      callbacks?.onError?.(pageNum + 1, errMsg);
    }
  }

  callbacks?.onLog?.(
    failedPages.length > 0
      ? `Parsed ${quizData.length} questions, ${failedPages.length} page(s) failed.`
      : "Quiz parsing complete!",
  );

  return { questions: quizData, failedPages, totalPages: pages.length };
}
