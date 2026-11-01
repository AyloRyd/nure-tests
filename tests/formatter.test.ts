import { describe, expect, it } from "vitest";
import {
  formatForAI,
  formatQuizData,
  parseAnswersJson,
} from "../src/core/formatter";
import type { Question } from "../src/types";

const questions: Question[] = [
  { index: 1, text: "2 + 2?", type: "single", answers: ["3", "4"] },
  {
    index: 2,
    text: "Match",
    type: "select",
    answers: ["A", "B"],
    subquestions: ["first", "second"],
    hasImages: true,
  },
];

describe("formatQuizData", () => {
  it("lists every question with its options", () => {
    const out = formatQuizData(questions);
    expect(out).toContain("Question #1 [single]\n2 + 2?\n3\n4\n---");
    expect(out).toContain("[1] first\n[2] second");
    expect(out).toContain("(contains images that are not included)");
  });
});

describe("formatForAI", () => {
  it("embeds the questions as JSON with subquestions", () => {
    const out = formatForAI(questions);
    const json = JSON.parse(
      out.slice(out.indexOf("```json") + 7, out.lastIndexOf("```")),
    );
    expect(json[0]).toEqual({
      question: "2 + 2?",
      type: "single",
      options: ["3", "4"],
    });
    expect(json[1].subquestions).toEqual(["first", "second"]);
  });
});

describe("parseAnswersJson", () => {
  it("accepts a fenced block with text around it", () => {
    const reply =
      'Sure! Here you go:\n```json\n{ "2 + 2?": ["4"] }\n```\nGood luck.';
    expect(parseAnswersJson(reply)).toEqual({ "2 + 2?": ["4"] });
  });

  it("wraps single string and number values", () => {
    expect(parseAnswersJson('{"a": "x", "b": 5}')).toEqual({
      a: ["x"],
      b: ["5"],
    });
  });

  it("rejects arrays and invalid values", () => {
    expect(() => parseAnswersJson('[["x"]]')).toThrow();
    expect(() => parseAnswersJson('{"a": {"b": 1}}')).toThrow(
      /array of strings/,
    );
  });
});
