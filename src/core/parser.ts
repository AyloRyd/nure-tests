import type { Question, AnswerType } from "../types";

export function getQuestion(container: Element): string {
  const questionElement = container.querySelector(".qtext");
  return questionElement
    ? questionElement.textContent?.trim() || "No question found"
    : "No question found";
}

export function getAnswersType(container: Element): AnswerType {
  const answerContainer = container.querySelector(".answer");
  if (!answerContainer) return "Unknown";
  const radioInputs = answerContainer.querySelectorAll('input[type="radio"]');
  const checkboxInputs = answerContainer.querySelectorAll(
    'input[type="checkbox"]',
  );
  if (radioInputs.length > 0) {
    return "SingleAnswer";
  } else if (checkboxInputs.length > 0) {
    return "MultipleAnswer";
  } else {
    return "Unknown";
  }
}

export function getAnswers(container: Element): string[] {
  const answerElements = container.querySelectorAll(
    '[data-region="answer-label"]',
  );
  const answers: string[] = [];
  answerElements.forEach((element) => {
    const text = element.textContent?.trim();
    if (text) {
      answers.push(text);
    }
  });
  return answers;
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
