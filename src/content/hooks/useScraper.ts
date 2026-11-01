import { useState, useEffect, useRef } from "react";
import type { Question, ScrapeProgress } from "../../types";
import { runScraper } from "../../core/scraper";

export function useScraper(
  enabled: boolean,
  onScrapeFinish?: (questions: Question[]) => void,
  initialQuestions?: Question[],
) {
  const hasInitial = !!initialQuestions && initialQuestions.length > 0;
  const [status, setStatus] = useState<ScrapeProgress["status"]>(
    hasInitial ? "completed" : "idle",
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions || [],
  );
  const [failedPages, setFailedPages] = useState<number[]>([]);
  const hasStarted = useRef(hasInitial);
  // Bumped by reset() so the effect below runs again
  const [runId, setRunId] = useState(0);

  const reset = () => {
    hasStarted.current = false;
    setStatus("idle");
    setLogs([]);
    setQuestions([]);
    setFailedPages([]);
    setRunId((id) => id + 1);
  };

  useEffect(() => {
    if (!enabled || hasStarted.current) return;
    hasStarted.current = true;

    let active = true;
    let done = false;

    const run = async () => {
      setStatus("scraping");
      try {
        const result = await runScraper(window.location.href, document, {
          onLog: (log) => {
            if (active) setLogs((prev) => [...prev, log]);
          },
        });

        done = true;
        if (!active) return;
        setQuestions(result.questions);
        setFailedPages(result.failedPages);
        if (result.questions.length === 0) {
          setStatus("error");
          return;
        }
        setStatus("completed");
        onScrapeFinish?.(result.questions);
      } catch (err: unknown) {
        done = true;
        if (active) {
          setStatus("error");
          const errMsg = err instanceof Error ? err.message : String(err);
          setLogs((prev) => [...prev, `Scrape failed: ${errMsg}`]);
        }
      }
    };

    run();

    return () => {
      active = false;
      // An interrupted scrape may start again on the next run
      if (!done) hasStarted.current = false;
    };
  }, [enabled, onScrapeFinish, runId]);

  return {
    status,
    logs,
    questions,
    failedPages,
    reset,
  };
}
