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
  const questionButtons = doc.querySelectorAll(".qnbutton");
  return questionButtons.length;
}

export interface ScraperCallbacks {
  onProgress?: (processed: number, total: number) => void;
  onLog?: (log: string) => void;
  onError?: (page: number, error: string) => void;
}

export async function runScraper(
  currentUrl: string,
  doc: Document,
  callbacks?: ScraperCallbacks,
): Promise<Question[]> {
  const { baseUrl, params } = getBaseUrlAndParams(currentUrl);
  const totalQuestions = getTotalQuestionsCount(doc);

  if (callbacks?.onLog) {
    callbacks.onLog(
      `Found ${totalQuestions} questions in total. Starting extraction...`,
    );
  }

  const quizData: Question[] = [];
  let questionIndex = 0;

  for (let pageNum = 0; pageNum < totalQuestions; pageNum++) {
    const pageUrl = generatePageUrl(baseUrl, params, pageNum);
    if (callbacks?.onLog) {
      callbacks.onLog(`Processing page ${pageNum + 1}/${totalQuestions}...`);
    }

    try {
      const response = await fetch(pageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();

      if (typeof __DEV__ !== "undefined" && __DEV__) {
        fetch("http://localhost:3010/api/save-page", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pageNum: pageNum + 1, html, url: pageUrl }),
        }).catch((err) => {
          console.warn("[Dev Mode] Failed to save page to dev-server:", err);
        });
      }
      const parser = new DOMParser();
      const pageDoc = parser.parseFromString(html, "text/html");

      const questionContainers = pageDoc.querySelectorAll(".que");
      questionContainers.forEach((container) => {
        const question = parseQuestionBlock(container, questionIndex + 1);
        quizData.push(question);
        questionIndex++;
      });

      if (callbacks?.onProgress) {
        callbacks.onProgress(pageNum + 1, totalQuestions);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (callbacks?.onLog) {
        callbacks.onLog(`Error processing page ${pageNum + 1}: ${errMsg}`);
      }
      if (callbacks?.onError) {
        callbacks.onError(pageNum + 1, errMsg);
      }
    }
  }

  if (callbacks?.onLog) {
    callbacks.onLog("Quiz parsing complete!");
  }

  return quizData;
}
