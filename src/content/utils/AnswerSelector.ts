import {
  getAnswersType,
  getOptionLabelText,
  getQtextText,
  isPlaceholderOption,
  normalizeForMatch,
  stripOptionLetter,
} from "../../core/parser";
import type { AnswerType, AiAnswers } from "../../types";

function injectGlowStyles() {
  if (document.getElementById("nuretests-glow-styles")) return;
  const style = document.createElement("style");
  style.id = "nuretests-glow-styles";
  style.textContent = `
    @keyframes nuretests-glow {
      0% {
        box-shadow: 0 0 0 0px rgba(99, 102, 241, 0);
        background-color: rgba(99, 102, 241, 0);
      }
      25% {
        box-shadow: 0 0 16px 4px rgba(99, 102, 241, 0.45);
        background-color: rgba(99, 102, 241, 0.15);
      }
      75% {
        box-shadow: 0 0 16px 4px rgba(99, 102, 241, 0.45);
        background-color: rgba(99, 102, 241, 0.15);
      }
      100% {
        box-shadow: 0 0 0 0px rgba(99, 102, 241, 0);
        background-color: rgba(99, 102, 241, 0);
      }
    }
    .nuretests-glow-active {
      animation: nuretests-glow 1.5s ease-in-out forwards;
      border-radius: 8px;
      transition: all 0.3s;
    }
  `;
  document.head.appendChild(style);
}

function triggerGlowAnimation(element: Element) {
  injectGlowStyles();
  element.classList.add("nuretests-glow-active");
  setTimeout(() => {
    element.classList.remove("nuretests-glow-active");
  }, 1500);
}

/** Text of a question block as used for answer keys. */
export function getQuestionBlockText(block: Element): string | null {
  const qtextEl = block.querySelector(".qtext");
  return qtextEl ? getQtextText(qtextEl) : null;
}

/**
 * Finds the imported answers for a question. Exact key first, then a loose
 * match that tolerates the small rewrites LLMs make to the question text.
 */
export function createAnswerLookup(answers: AiAnswers) {
  const normalized = new Map<string, string[]>();
  for (const [key, value] of Object.entries(answers)) {
    const norm = normalizeForMatch(key);
    if (!normalized.has(norm)) normalized.set(norm, value);
  }
  return (questionText: string): string[] | undefined =>
    answers[questionText] ?? normalized.get(normalizeForMatch(questionText));
}

export function optionMatches(optionText: string, answer: string): boolean {
  const option = normalizeForMatch(optionText);
  const target = normalizeForMatch(answer);
  if (option === target) return true;
  const stripped = normalizeForMatch(stripOptionLetter(answer.trim()));
  return stripped !== "" && option === stripped;
}

function matchesAny(optionText: string, answers: string[]): boolean {
  return answers.some((ans) => optionMatches(optionText, ans));
}

function findInputForLabel(
  questionElement: Element,
  label: Element,
): HTMLInputElement | null {
  const labelId = label.getAttribute("id");
  if (labelId) {
    const input = questionElement.querySelector<HTMLInputElement>(
      `input[aria-labelledby="${labelId.replace(/["\\]/g, "\\$&")}"]`,
    );
    if (input) return input;
  }
  return (
    label.parentElement?.querySelector<HTMLInputElement>(
      'input[type="radio"], input[type="checkbox"]',
    ) ?? null
  );
}

/** Whether the user (or an earlier apply) already gave an answer to this question. */
export function isQuestionAnswered(block: Element): boolean {
  if (
    block.querySelector(
      'input[type="radio"]:checked:not([value="-1"]), input[type="checkbox"]:checked:not([name$=":flagged"])',
    )
  ) {
    return true;
  }
  const texts = block.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    '.formulation input[type="text"], .formulation textarea',
  );
  if (Array.from(texts).some((el) => el.value.trim() !== "")) return true;
  const selects = block.querySelectorAll<HTMLSelectElement>(
    ".formulation select",
  );
  return Array.from(selects).some((select) => {
    const option = select.options[select.selectedIndex];
    return option !== undefined && !isPlaceholderOption(option);
  });
}

export function selectAnswersForQuestion(
  questionElement: Element,
  correctAnswers: string[],
  questionType: AnswerType,
): boolean {
  let anySelected = false;

  if (questionType === "single" || questionType === "multiple") {
    const labels = questionElement.querySelectorAll(
      '[data-region="answer-label"]',
    );
    const isMultiple = questionType === "multiple";

    labels.forEach((label) => {
      const input = findInputForLabel(questionElement, label);
      if (!input) return;
      const isCorrect = matchesAny(getOptionLabelText(label), correctAnswers);

      if (isCorrect) {
        if (!input.checked) input.click();
        triggerGlowAnimation(label.closest(".r0, .r1") ?? label);
        anySelected = true;
      } else if (isMultiple && input.checked) {
        // Untick leftovers so the selection matches the imported answers exactly
        input.click();
      }
    });
  } else if (questionType === "short") {
    const textInput = questionElement.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >('.formulation input[type="text"], .formulation textarea');

    if (textInput && correctAnswers.length > 0) {
      const targetVal = correctAnswers[0];
      if (textInput.value !== targetVal) {
        textInput.value = targetVal;
        textInput.dispatchEvent(new Event("input", { bubbles: true }));
        textInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
      triggerGlowAnimation(textInput);
      anySelected = true;
    }
  } else if (questionType === "select") {
    const selects = Array.from(
      questionElement.querySelectorAll<HTMLSelectElement>(
        ".formulation select",
      ),
    );
    // Several dropdowns get one answer each, in order
    const perSelect =
      selects.length > 1 && correctAnswers.length === selects.length;

    selects.forEach((select, i) => {
      const wanted = perSelect ? [correctAnswers[i]] : correctAnswers;
      const option = Array.from(select.options).find(
        (opt) =>
          !isPlaceholderOption(opt) &&
          matchesAny(opt.textContent || "", wanted),
      );
      if (!option) return;
      if (select.value !== option.value) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      triggerGlowAnimation(select);
      anySelected = true;
    });
  }

  return anySelected;
}

export interface AutoSelectOptions {
  /** Leave questions the user already answered alone. */
  onlyUnanswered?: boolean;
}

/**
 * Scan the Moodle quiz DOM, find questions, match them against AI JSON answers, and auto-select.
 */
export function autoSelectAllVisibleQuestions(
  answers: AiAnswers,
  options: AutoSelectOptions = {},
): number {
  const lookup = createAnswerLookup(answers);
  let matchCount = 0;

  document.querySelectorAll(".que").forEach((block) => {
    const text = getQuestionBlockText(block);
    if (text === null) return;

    const correctAnswers = lookup(text);
    if (!correctAnswers) return;
    if (options.onlyUnanswered && isQuestionAnswered(block)) return;

    if (
      selectAnswersForQuestion(block, correctAnswers, getAnswersType(block))
    ) {
      matchCount++;
    }
  });

  return matchCount;
}

/**
 * Clear all selected answers (radios, checkboxes, text inputs, selects) on the current page.
 */
export function clearAllSelectedAnswers(): void {
  document.querySelectorAll(".que").forEach((block) => {
    block
      .querySelectorAll<HTMLInputElement>(
        '.formulation input[type="radio"], .formulation input[type="checkbox"]',
      )
      .forEach((input) => {
        if (input.checked) {
          input.checked = false;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });

    block
      .querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement
      >('.formulation input[type="text"], .formulation textarea')
      .forEach((input) => {
        if (input.value !== "") {
          input.value = "";
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });

    block
      .querySelectorAll<HTMLSelectElement>(".formulation select")
      .forEach((select) => {
        if (select.selectedIndex !== 0 && select.options.length > 0) {
          select.selectedIndex = 0;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
  });
}
