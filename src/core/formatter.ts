import type { Question } from '../types';

export function formatQuizData(questions: Question[]): string {
  let formattedOutput = '';
  questions.forEach((item) => {
    formattedOutput += `Question #${item.index} [${item.type.toLowerCase()}]\n`;
    formattedOutput += `${item.text}\n`;
    item.answers.forEach((answer) => {
      formattedOutput += `${answer}\n`;
    });
    formattedOutput += '---\n';
  });
  return formattedOutput;
}

export function formatForGPT(questions: Question[]): string {
  const prompt =
    'Answer only in the format: **{question_number}. {question_text}**\n{correct_options}, where the correct options are listed with both their text and identifier.\n---';
  return `${prompt}\n\n${formatQuizData(questions)}`;
}
