# NURETests Parser Extension

> [!NOTE]
> The original small bookmarklet script for parsing quizzes was written by [@SALOway](https://github.com/SALOway).

Browser extension for Moodle quizzes on [dl.nure.ua](https://dl.nure.ua). It scrapes the questions, builds a prompt you can paste into an LLM, takes the JSON answers back and ticks them on the page for you.

## What it does

- **Parse** – walks through every page of the attempt in the background and collects the questions. Output is either plain text or a ready-made LLM prompt, copied to clipboard in one click
- **Import** – paste the JSON the LLM gave back
- **Auto-apply** – matches imported answers to the questions on the current page and selects them. Works with single choice, multiple choice, dropdowns and short text answers. Applied fields glow for a moment so you can see what changed
- **Overlay** – panel docks to the left or right edge, or collapses out of the way
- **Persistence** – active tab, panel side, imported answers and the auto-apply toggle survive a page reload

## Answers format

The generated prompt asks for a JSON object where keys are the exact question text and values are arrays of correct answers:

```json
{
  "What is 2 + 2?": ["4"],
  "Pick the prime numbers": ["2", "3", "5"]
}
```

## Sequential quizzes

If a quiz uses sequential navigation, Moodle won't let you go back. Scraping fetches the following pages, which moves the attempt forward and leaves earlier questions unanswered. The extension warns you before scraping, but read the warning.

A single question mode that only parses the current page is planned.

## Running locally

Needs [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/).

```bash
pnpm install
```

```bash
pnpm dev
```

`pnpm dev` rebuilds the popup and content script into `dist/` on every change, and starts a helper server on `http://localhost:3010`. The server saves HTML snapshots of parsed quizzes into `.pages/` (gitignored) and serves them back as mock quiz pages, so you can test without a live attempt.

Or all at once:

```bash
git clone https://github.com/AyloRyd/nure-tests.git && cd nure-tests && pnpm install && pnpm build && pnpm dev
```

### Loading the extension

Chrome / Chromium:

1. Open `chrome://extensions/`
2. Turn on developer mode
3. Click "Load unpacked" and pick `dist/`

Firefox:

1. Open `about:debugging`
2. Go to "This Firefox"
3. Click "Load Temporary Add-on" and pick `dist/manifest.json`

## Scripts

| Command       | What it does                    |
| ------------- | ------------------------------- |
| `pnpm dev`    | Watch build + helper server     |
| `pnpm build`  | Type-check and production build |
| `pnpm check`  | Lint + type-check               |
| `pnpm format` | Run prettier over the repo      |
