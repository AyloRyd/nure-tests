import type { Question, AnswerType } from "../types";

export function cleanQuestionText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function cleanOptionText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Loose form of a question or option text used for matching imported answers.
 * LLMs tend to swap apostrophes, quotes, dashes and ellipses or drop the final
 * punctuation, so all of that is folded away.
 */
export function normalizeForMatch(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’ʼʹ`´]/g, "'")
    .replace(/[“”„«»]/g, '"')
    .replace(/[‐-―−]/g, "-")
    .replace(/…/g, "...")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\s.,;:!?…]+$/, "");
}

/** Drops a leading option letter like "a. " or "б) " that an LLM may copy. */
export function stripOptionLetter(text: string): string {
  return text.replace(/^[a-zа-яієїґ][.)]\s+/i, "");
}

/** Visible label of a radio/checkbox option without Moodle's "a. " numbering. */
export function getOptionLabelText(label: Element): string {
  const clone = label.cloneNode(true) as Element;
  clone.querySelectorAll(".answernumber").forEach((el) => el.remove());
  return cleanOptionText(clone.textContent || "");
}

/** Moodle uses value "" (gap select) or "0" (matching) for the "Choose..." placeholder. */
export function isPlaceholderOption(option: HTMLOptionElement): boolean {
  return option.value === "" || option.value === "0";
}

/** Text of a .qtext element, with inline dropdowns and inputs shown as gaps. */
export function getQtextText(qtext: Element): string {
  const clone = qtext.cloneNode(true) as Element;
  clone
    .querySelectorAll("select, input")
    .forEach((el) => el.replaceWith(" ___ "));
  return cleanQuestionText(clone.textContent || "");
}

export function getQuestion(container: Element): string {
  const questionElement = container.querySelector(".qtext");
  return questionElement
    ? getQtextText(questionElement) || "No question found"
    : "No question found";
}

export function getAnswersType(container: Element): AnswerType {
  // Cloze questions mix several input kinds in one block
  if (container.classList.contains("multianswer")) return "unknown";

  const answerContainer = container.querySelector(".answer, .ablock");
  const base = answerContainer || container;

  if (base.querySelector('input[type="radio"]')) return "single";
  // The "flag question" toggle is a checkbox too
  if (base.querySelector('input[type="checkbox"]:not([name$=":flagged"])')) {
    return "multiple";
  }
  if (container.querySelector(".formulation select")) return "select";
  if (base.querySelector('input[type="text"], textarea')) return "short";
  return "unknown";
}

export function getAnswers(container: Element): string[] {
  const answerElements = container.querySelectorAll(
    '[data-region="answer-label"]',
  );
  if (answerElements.length > 0) {
    return Array.from(answerElements)
      .map(getOptionLabelText)
      .filter((text) => text !== "");
  }

  const selectOptions = container.querySelectorAll<HTMLOptionElement>(
    ".formulation select option",
  );
  if (selectOptions.length > 0) {
    const answers = Array.from(selectOptions)
      .filter((option) => !isPlaceholderOption(option))
      .map((option) => cleanOptionText(option.textContent || ""))
      .filter((text) => text !== "");
    return Array.from(new Set(answers));
  }

  return [];
}

/** Labels for each dropdown of a matching question. */
export function getSubquestions(container: Element): string[] | undefined {
  const selects = container.querySelectorAll(".formulation select");
  if (selects.length < 2) return undefined;

  return Array.from(selects).map((select, i) => {
    const row = select.closest("tr");
    const stem = row?.querySelector(".text");
    const text = stem ? cleanQuestionText(stem.textContent || "") : "";
    return text || `Gap ${i + 1}`;
  });
}

export function parseQuestionBlock(
  container: Element,
  index: number,
): Question {
  const question: Question = {
    index,
    text: getQuestion(container),
    type: getAnswersType(container),
    answers: getAnswers(container),
  };
  const subquestions = getSubquestions(container);
  if (subquestions) question.subquestions = subquestions;
  if (container.querySelector(".qtext img")) question.hasImages = true;
  return question;
}
