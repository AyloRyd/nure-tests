import type { Question } from "../types";

export function formatQuizData(questions: Question[]): string {
  let formattedOutput = "";
  questions.forEach((item) => {
    formattedOutput += `Question #${item.index} [${item.type.toLowerCase()}]\n`;
    formattedOutput += `${item.text}\n`;
    item.answers.forEach((answer) => {
      formattedOutput += `${answer}\n`;
    });
    formattedOutput += "---\n";
  });
  return formattedOutput;
}

export function formatForAI(questions: Question[]): string {
  const prompt = `Solve the quiz questions provided in the JSON array below.
Return a valid JSON object where:
- Keys are the exact question text.
- Values are JSON arrays containing the correct answers.
- For SingleAnswer, MultipleAnswer, and SelectAnswer: choose the correct answer text(s) from the provided options.
- For ShortAnswer: write the correct text answer on your own (since options is empty).
Do not include any extra text, markdown formatting (other than a json code block), or explanations.

Example output:
{
  "Question text here?": ["Correct Option text"]
}

Questions to solve:`;

  const inputData = questions.map((q) => ({
    question: q.text,
    type: q.type,
    options: q.answers,
  }));

  return `${prompt}\n\`\`\`json\n${JSON.stringify(inputData, null, 2)}\n\`\`\``;
}
