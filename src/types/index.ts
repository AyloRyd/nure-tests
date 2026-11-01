export type AnswerType = "single" | "multiple" | "short" | "select" | "unknown";

export interface Question {
  index: number;
  text: string;
  type: AnswerType;
  answers: string[];
  /** Labels of each dropdown when a question has more than one (matching, gap select). */
  subquestions?: string[];
  /** Question text contains images that can't be passed along as text. */
  hasImages?: boolean;
}

export interface ScrapeProgress {
  currentPage: number;
  totalPages: number;
  status: "idle" | "scraping" | "completed" | "error";
  logs: string[];
  output: string;
}

export type AiAnswers = Record<string, string[]>;
