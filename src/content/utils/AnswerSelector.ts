import { cleanQuestionText, cleanOptionText } from "../../core/parser";
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

function triggerGlowAnimation(element: HTMLElement | Element) {
  injectGlowStyles();
  element.classList.add("nuretests-glow-active");
  setTimeout(() => {
    element.classList.remove("nuretests-glow-active");
  }, 1500);
}

export function selectAnswersForQuestion(
  questionElement: Element,
  correctAnswers: string[],
  questionType: AnswerType,
): boolean {
  let anySelected = false;

  if (questionType === "SingleAnswer" || questionType === "MultipleAnswer") {
    const labels = questionElement.querySelectorAll(
      '[data-region="answer-label"]',
    );
    labels.forEach((label) => {
      const labelText = label.textContent || "";
      const cleanedLabelText = cleanOptionText(labelText);

      // Check if this label is in the correct answers
      const isCorrect = correctAnswers.some(
        (ans) => cleanOptionText(ans) === cleanedLabelText,
      );

      if (isCorrect) {
        // Look for input element (radio/checkbox)
        const labelId = label.getAttribute("id");
        let input: HTMLInputElement | null = null;

        if (labelId) {
          input = questionElement.querySelector(
            `input[aria-labelledby*="${labelId}"], input[id="${labelId}"]`,
          );
        }

        if (!input) {
          const parent = label.closest("div");
          if (parent) {
            input = parent.querySelector(
              'input[type="radio"], input[type="checkbox"]',
            );
          }
        }

        if (input) {
          if (!input.checked) {
            input.click();
            anySelected = true;
          }
          // Highlight the row wrapper
          const row = label.closest(".r0, .r1, div");
          if (row) {
            triggerGlowAnimation(row);
            anySelected = true;
          }
        }
      }
    });
  } else if (questionType === "ShortAnswer") {
    const textInput = questionElement.querySelector(
      'input[type="text"], textarea',
    ) as HTMLInputElement | HTMLTextAreaElement | null;

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
  } else if (questionType === "SelectAnswer") {
    const selects = questionElement.querySelectorAll("select");
    selects.forEach((select) => {
      const options = select.querySelectorAll("option");
      options.forEach((option) => {
        const optionText = option.textContent || "";
        const cleanedOption = cleanOptionText(optionText);

        const isCorrect = correctAnswers.some(
          (ans) => cleanOptionText(ans) === cleanedOption,
        );

        if (isCorrect) {
          if (select.value !== option.value) {
            select.value = option.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            anySelected = true;
          }
          triggerGlowAnimation(select);
          anySelected = true;
        }
      });
    });
  }

  return anySelected;
}

/**
 * Scan the Moodle quiz DOM, find questions, match them against AI JSON answers, and auto-select.
 */
export function autoSelectAllVisibleQuestions(answers: AiAnswers): number {
  const questionBlocks = document.querySelectorAll(".que");
  let matchCount = 0;

  questionBlocks.forEach((block) => {
    const questionTextEl = block.querySelector(".qtext");
    if (!questionTextEl) return;

    const cleanedQText = cleanQuestionText(questionTextEl.textContent || "");

    // Find matching correct answers array in the dictionary
    const correctAnswers = answers[cleanedQText];
    if (correctAnswers) {
      // Determine type
      // We can derive type dynamically
      const radioInputs = block.querySelectorAll('input[type="radio"]');
      const checkboxInputs = block.querySelectorAll('input[type="checkbox"]');
      const textInputs = block.querySelectorAll('input[type="text"], textarea');
      const selectElements = block.querySelectorAll("select");

      let type: AnswerType = "Unknown";
      if (radioInputs.length > 0) type = "SingleAnswer";
      else if (checkboxInputs.length > 0) type = "MultipleAnswer";
      else if (textInputs.length > 0) type = "ShortAnswer";
      else if (selectElements.length > 0) type = "SelectAnswer";

      const success = selectAnswersForQuestion(block, correctAnswers, type);
      if (success) {
        matchCount++;
      }
    }
  });

  return matchCount;
}

/**
 * Clear all selected answers (radios, checkboxes, text inputs, selects) on the current page.
 */
export function clearAllSelectedAnswers(): void {
  const questionBlocks = document.querySelectorAll(".que");
  questionBlocks.forEach((block) => {
    // 1. Clear radios & checkboxes
    const inputs = block.querySelectorAll(
      'input[type="radio"], input[type="checkbox"]',
    );
    inputs.forEach((input) => {
      const htmlInput = input as HTMLInputElement;
      if (htmlInput.checked) {
        htmlInput.checked = false;
        htmlInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // 2. Clear text inputs & textareas
    const textInputs = block.querySelectorAll('input[type="text"], textarea');
    textInputs.forEach((input) => {
      const htmlInput = input as HTMLInputElement | HTMLTextAreaElement;
      if (htmlInput.value !== "") {
        htmlInput.value = "";
        htmlInput.dispatchEvent(new Event("input", { bubbles: true }));
        htmlInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // 3. Clear selects
    const selects = block.querySelectorAll("select");
    selects.forEach((select) => {
      const htmlSelect = select as HTMLSelectElement;
      if (htmlSelect.selectedIndex !== 0 && htmlSelect.options.length > 0) {
        htmlSelect.selectedIndex = 0; // Usually the first option is the "Choose..." or blank option
        htmlSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });
}
