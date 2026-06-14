import type { Question, AnswerType } from "../types";

export function cleanQuestionText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function cleanOptionText(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  // Strip common option prefixes like "a. ", "b) ", "1. ", "A) "
  return normalized.replace(/^[a-zA-Z0-9][-.)]\s*/, "").trim();
}

export function getQuestion(container: Element): string {
  const questionElement = container.querySelector(".qtext");
  const rawText = questionElement
    ? questionElement.textContent || "No question found"
    : "No question found";
  return cleanQuestionText(rawText);
}

export function getAnswersType(container: Element): AnswerType {
  const answerContainer = container.querySelector(".answer");
  const base = answerContainer || container;

  const radioInputs = base.querySelectorAll('input[type="radio"]');
  const checkboxInputs = base.querySelectorAll('input[type="checkbox"]');
  const textInputs = base.querySelectorAll('input[type="text"], textarea');
  const selectElements = base.querySelectorAll("select");

  if (radioInputs.length > 0) {
    return "SingleAnswer";
  } else if (checkboxInputs.length > 0) {
    return "MultipleAnswer";
  } else if (textInputs.length > 0) {
    return "ShortAnswer";
  } else if (selectElements.length > 0) {
    return "SelectAnswer";
  } else {
    return "Unknown";
  }
}

export function getAnswers(container: Element): string[] {
  // 1. Check for standard checkbox/radio labels
  const answerElements = container.querySelectorAll(
    '[data-region="answer-label"]',
  );
  if (answerElements.length > 0) {
    const answers: string[] = [];
    answerElements.forEach((element) => {
      const text = element.textContent;
      if (text) {
        answers.push(cleanOptionText(text));
      }
    });
    return answers;
  }

  // 2. Check for select dropdown options
  const selectOptions = container.querySelectorAll("select option");
  if (selectOptions.length > 0) {
    const answers: string[] = [];
    selectOptions.forEach((element) => {
      const text = element.textContent?.trim();
      // Skip empty/placeholder options like "Choose..." or empty strings
      if (text && text !== "" && !text.includes("...")) {
        answers.push(cleanOptionText(text));
      }
    });
    // Deduplicate
    return Array.from(new Set(answers));
  }

  return [];
}

export function parseQuestionBlock(
  container: Element,
  index: number,
): Question {
  return {
    index,
    text: getQuestion(container),
    type: getAnswersType(container),
    answers: getAnswers(container),
  };
}
