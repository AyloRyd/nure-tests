# NURETests Parser Extension

> [!NOTE]
> The original small bookmarklet script for parsing quizzes was written by [@SALOway](https://github.com/SALOway).

A powerful browser extension designed to parse and import answers for quizzes on Moodle-based LMS sites (specifically configured for NURE's `dl.nure.ua`). It features dynamic test scraping, AI answer mapping, auto-selection, and a modern collapsible overlay interface.

---

## Features

- **Parse Test**: Scrapes quiz questions automatically. It fetches all pages in the background and reformats the output into structured text or AI-optimized prompts (copied to clipboard with a single click).
- **Import AI Answers**: Allows pasting AI-generated JSON answers directly into the extension.
- **Auto-Apply Answers**: Automatically scans the page, matches questions to the imported answers, and instantly selects the correct options (supports multiple-choice, single-choice, dropdowns, and text/short-answer inputs).
- **Visual Glow Effect**: Highlights successfully auto-applied elements on the Moodle page with a temporary glowing animation.
- **Collapsible UI**: Dock the panel to either the left or right side of your screen, or collapse/minimize it to stay out of the way.
- **Session Persistence**: Restores your active tab, panel position, imported answers, and auto-apply toggle state automatically after reloading the page.

---

## Sequential Quiz Protection

When sequential navigation is enabled in a Moodle quiz, navigating back to previous questions is disabled. Scraping all questions at once by fetching subsequent pages in the background would advance your quiz attempt, locking you out of the current page and leaving previous questions ungraded.

To prevent accidental lockout:

- The extension displays a prominent warning prompt before initiating a scrape, ensuring you are aware of the risks on sequential navigation quizzes.
- **Future Roadmap**: We plan to implement a safe **Single Question Mode** that only parses the currently active question on the screen, allowing you to safely parse sequential quizzes page-by-page.

---

## How to Run Locally

To run the extension in your browser, it must first be compiled into the `dist/` directory. You can do this in watch mode for development (which automatically recompiles on changes) or run a one-time production build.

### 1. Install Dependencies

Make sure you have [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) installed, then run:

```bash
pnpm install
```

### 2. Start the Development Server

Run the dev server to start building popup/content scripts in watch mode and launch a local helper server for logging parsed pages:

```bash
pnpm dev
```

This script:

- Compiles components, content scripts, and styles into the `dist/` directory, rebuilding automatically on change.
- Launches a local Node.js helper server on `http://localhost:3010` that automatically saves captured HTML snapshots of parsed quizzes into a gitignored `.pages/` folder for offline testing.

### 3. Load the Extension into Your Browser

#### Google Chrome / Chromium-based browsers:

1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** on in the top-right corner.
3. Click **Load unpacked** in the top-left corner.
4. Select the `dist/` directory from this project's root folder.

#### Mozilla Firefox:

1. Open Firefox and navigate to `about:debugging`.
2. Click **This Firefox** in the sidebar.
3. Click **Load Temporary Add-on...** under Temporary Extensions.
4. Select the `manifest.json` file inside the compiled `dist/` folder.

### Quick Start (One-Liner)

To clone the repository, install dependencies, build the extension, and start the development server in watch mode all in one command, run:

```bash
git clone https://github.com/AyloRyd/nure-tests.git && cd nure-tests && pnpm install && pnpm build && pnpm dev
```

---

## Build for Production

To perform static type-checking and build optimized, minified production assets, run:

```bash
pnpm build
```

The production bundles will be compiled and structured inside the `dist/` directory, ready to be packaged.
