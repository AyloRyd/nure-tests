import type { Question } from "../types";

export function formatQuizData(questions: Question[]): string {
  let formattedOutput = "";
  questions.forEach((item) => {
    formattedOutput += `Question #${item.index} [${item.type.toLowerCase()}]\n`;
    formattedOutput += `${item.text}\n`;
    if (item.hasImages) {
      formattedOutput += "(contains images that are not included)\n";
    }
    item.subquestions?.forEach((sub, i) => {
      formattedOutput += `[${i + 1}] ${sub}\n`;
    });
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
- For single, multiple, and select: choose the correct answer text(s) from the provided options, copied exactly.
- For select with "subquestions": return one answer per subquestion, in the same order.
- For short: write the correct text answer on your own (since options is empty).
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
    ...(q.subquestions ? { subquestions: q.subquestions } : {}),
  }));

  return `${prompt}\n\`\`\`json\n${JSON.stringify(inputData, null, 2)}\n\`\`\``;
}

/**
 * Pulls the answers object out of whatever the user pasted: a bare JSON object,
 * a fenced code block, or a reply with text around the JSON.
 */
export function parseAnswersJson(input: string): Record<string, string[]> {
  const fenced = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let source = fenced ? fenced[1] : input;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start !== -1 && end > start) source = source.slice(start, end + 1);

  const parsed: unknown = JSON.parse(source);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(
      "Answers must be a JSON object mapping questions to answers.",
    );
  }

  const answers: Record<string, string[]> = {};
  for (const [key, val] of Object.entries(parsed)) {
    if (typeof val === "string" || typeof val === "number") {
      answers[key] = [String(val)];
    } else if (Array.isArray(val)) {
      answers[key] = val.map(String);
    } else {
      throw new Error(
        `Value for question "${key.substring(0, 20)}..." must be an array of strings.`,
      );
    }
  }
  return answers;
}
