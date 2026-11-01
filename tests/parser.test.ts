import { describe, expect, it } from "vitest";
import {
  normalizeForMatch,
  parseQuestionBlock,
  stripOptionLetter,
} from "../src/core/parser";
import { parseFixture } from "./helpers";

function parseAll(fixture: string) {
  const doc = parseFixture(fixture);
  return Array.from(doc.querySelectorAll(".que")).map((block, i) =>
    parseQuestionBlock(block, i + 1),
  );
}

describe("parseQuestionBlock on a saved dl.nure.ua page", () => {
  const questions = parseAll("pvit-page-1.html");

  it("finds every question on the page", () => {
    expect(questions).toHaveLength(4);
  });

  it("reads text, type and options without Moodle's a./b. numbering", () => {
    expect(questions[0]).toEqual({
      index: 1,
      text: "Customer Development Methodology (CDM) орієнтована на…",
      type: "single",
      answers: [
        "Дизайн продукту.",
        "Функціонал продукту та ринок відповідних товарів та послуг.",
        "Потреби споживачів.",
        "Функціонал продукту.",
        "Попит та пропозиції споживачів.",
      ],
    });
  });

  it("does not mistake the flag checkbox for a multiple choice question", () => {
    expect(questions.every((q) => q.type === "single")).toBe(true);
  });
});

describe("parseQuestionBlock on other question types", () => {
  const [multiple, match, gapselect, short, cloze] =
    parseAll("other-types.html");

  it("keeps option text that looks like a prefix intact", () => {
    expect(multiple.type).toBe("multiple");
    expect(multiple.answers).toEqual(["1.5", "2.5", "0.5", "X-ray"]);
  });

  it("reads matching questions with one subquestion per dropdown", () => {
    expect(match.type).toBe("select");
    expect(match.answers).toEqual(["Hierarchical", "Flat"]);
    expect(match.subquestions).toEqual(["ISO 9126", "FURPS"]);
  });

  it("skips the empty placeholder of gap select dropdowns", () => {
    expect(gapselect.type).toBe("select");
    expect(gapselect.text).toBe("The sky is ___ and grass is ___ .");
    expect(gapselect.answers).toEqual(["blue", "green"]);
    expect(gapselect.subquestions).toEqual(["Gap 1", "Gap 2"]);
  });

  it("detects short answers", () => {
    expect(short.type).toBe("short");
    expect(short.answers).toEqual([]);
  });

  it("marks cloze questions as unsupported", () => {
    expect(cloze.type).toBe("unknown");
  });
});

describe("normalizeForMatch", () => {
  it("folds the differences LLMs introduce", () => {
    expect(normalizeForMatch("Модель якості ПЗ’s  “FURPS”…")).toBe(
      normalizeForMatch('модель якості пз\'s "FURPS"'),
    );
    expect(normalizeForMatch("Стадія — ліквідності.")).toBe(
      normalizeForMatch("стадія - ліквідності"),
    );
  });

  it("keeps numbers apart", () => {
    expect(normalizeForMatch("1.5")).not.toBe(normalizeForMatch("2.5"));
  });
});

describe("stripOptionLetter", () => {
  it("removes a copied option letter", () => {
    expect(stripOptionLetter("c. Потреби споживачів.")).toBe(
      "Потреби споживачів.",
    );
    expect(stripOptionLetter("б) Так")).toBe("Так");
  });

  it("leaves real answers alone", () => {
    expect(stripOptionLetter("1.5")).toBe("1.5");
    expect(stripOptionLetter("X-ray")).toBe("X-ray");
  });
});
