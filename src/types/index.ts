export type AnswerType =
  | "SingleAnswer"
  | "MultipleAnswer"
  | "ShortAnswer"
  | "SelectAnswer"
  | "Unknown";

export interface Question {
  index: number;
  text: string;
  type: AnswerType;
  answers: string[];
}

export interface ScrapeProgress {
  currentPage: number;
  totalPages: number;
  status: "idle" | "scraping" | "completed" | "error";
  logs: string[];
  output: string;
}

export type AiAnswers = Record<string, string[]>;
