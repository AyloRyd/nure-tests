import { beforeEach, describe, expect, it } from "vitest";
import {
  autoSelectAllVisibleQuestions,
  clearAllSelectedAnswers,
  createAnswerLookup,
  isQuestionAnswered,
} from "../src/content/utils/AnswerSelector";
import { checkedLabels, loadFixtureIntoDocument } from "./helpers";

function block(id: string): Element {
  const el = document.getElementById(id);
  if (!el) throw new Error(`No block ${id}`);
  return el;
}

describe("createAnswerLookup", () => {
  it("matches question text an LLM slightly rewrote", () => {
    const lookup = createAnswerLookup({
      "customer development methodology (CDM) орієнтована на...": ["x"],
    });
    expect(
      lookup("Customer Development Methodology (CDM) орієнтована на…"),
    ).toEqual(["x"]);
    expect(lookup("Something else")).toBeUndefined();
  });
});

describe("autoSelectAllVisibleQuestions on a saved dl.nure.ua page", () => {
  beforeEach(() => {
    loadFixtureIntoDocument("pvit-page-1.html");
    clearAllSelectedAnswers();
  });

  it("selects the imported answers", () => {
    const matched = autoSelectAllVisibleQuestions({
      "Customer Development Methodology (CDM) орієнтована на…": [
        "Потреби споживачів.",
      ],
      // Rewritten by the LLM: no trailing "?" and an option letter copied in
      "До якої стадії розвитку стартапа відноситься ситуація коли є виникнення у бізнесу реальної ринкової вартості (можливість прямого продажу акцій або проведення IPO)":
        ["a. Стадія ліквідності (liquidity stage)."],
    });

    expect(matched).toBe(2);
    expect(checkedLabels(block("question-1376273-25"))).toEqual([
      "Потреби споживачів.",
    ]);
    expect(checkedLabels(block("question-1376273-22"))).toEqual([
      "Стадія ліквідності (liquidity stage).",
    ]);
  });

  it("leaves questions the user already answered alone when asked to", () => {
    const q = block("question-1376273-25");
    const userChoice = q.querySelector<HTMLInputElement>(
      'input[value="0"][type="radio"]',
    )!;
    userChoice.click();

    const matched = autoSelectAllVisibleQuestions(
      {
        "Customer Development Methodology (CDM) орієнтована на…": [
          "Потреби споживачів.",
        ],
      },
      { onlyUnanswered: true },
    );

    expect(matched).toBe(0);
    expect(checkedLabels(q)).toEqual(["Дизайн продукту."]);
  });
});

describe("autoSelectAllVisibleQuestions on other question types", () => {
  beforeEach(() => {
    loadFixtureIntoDocument("other-types.html");
  });

  it("sets checkboxes to exactly the imported answers", () => {
    const q = block("question-500-1");
    q.querySelector<HTMLInputElement>("#q500\\:1_choice2")!.click(); // 0.5, wrong

    autoSelectAllVisibleQuestions({
      "Pick the numbers greater than 1": ["1.5", "2.5"],
    });

    const checked = Array.from(
      q.querySelectorAll<HTMLInputElement>('.answer input[type="checkbox"]'),
    ).map((i) => i.checked);
    expect(checked).toEqual([true, true, false, false]);
  });

  it("fills each matching dropdown with its own answer", () => {
    autoSelectAllVisibleQuestions({
      "Match the model to its level": ["Hierarchical", "Flat"],
    });
    const values = Array.from(
      block("question-500-2").querySelectorAll("select"),
    ).map((s) => s.options[s.selectedIndex].textContent);
    expect(values).toEqual(["Hierarchical", "Flat"]);
  });

  it("fills gap select dropdowns in order", () => {
    autoSelectAllVisibleQuestions({
      "The sky is ___ and grass is ___.": ["blue", "green"],
    });
    const values = Array.from(
      block("question-500-3").querySelectorAll("select"),
    ).map((s) => s.options[s.selectedIndex].textContent);
    expect(values).toEqual(["blue", "green"]);
  });

  it("types short answers and treats them as answered afterwards", () => {
    const q = block("question-500-4");
    expect(isQuestionAnswered(q)).toBe(false);

    autoSelectAllVisibleQuestions({
      "Name the standard that defines software quality's model": ["ISO 9126"],
    });

    expect(q.querySelector<HTMLInputElement>("input[type=text]")!.value).toBe(
      "ISO 9126",
    );
    expect(isQuestionAnswered(q)).toBe(true);
  });

  it("does not touch unsupported cloze questions", () => {
    const matched = autoSelectAllVisibleQuestions({
      "Cloze: 2 + 2 = ___ and pick ___": ["4", "yes"],
    });
    expect(matched).toBe(0);
  });
});
