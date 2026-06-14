import { useState, useEffect, useRef } from "react";
import type { Question, ScrapeProgress } from "../../types";
import { runScraper } from "../../core/scraper";

export function useScraper(
  enabled: boolean,
  onScrapeFinish?: (questions: Question[]) => void,
  initialQuestions?: Question[],
) {
  const [status, setStatus] = useState<ScrapeProgress["status"]>(
    initialQuestions && initialQuestions.length > 0 ? "completed" : "idle",
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions || [],
  );
  const hasStarted = useRef(initialQuestions && initialQuestions.length > 0);

  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      if (!hasStarted.current) {
        hasStarted.current = true;
        setStatus("completed");
        setQuestions(initialQuestions);
      }
    }
  }, [initialQuestions]);

  const reset = () => {
    hasStarted.current = false;
    setStatus("idle");
    setLogs([]);
    setQuestions([]);
  };

  useEffect(() => {
    if (!enabled || hasStarted.current) return;
    hasStarted.current = true;

    let active = true;

    const run = async () => {
      setStatus("scraping");
      try {
        const parsedQuestions = await runScraper(
          window.location.href,
          document,
          {
            onLog: (log) => {
              if (active) setLogs((prev) => [...prev, log]);
            },
            onError: (page, error) => {
              if (active) {
                setLogs((prev) => [...prev, `[Error Page ${page}]: ${error}`]);
              }
            },
          },
        );

        if (active) {
          setQuestions(parsedQuestions);
          setStatus("completed");
          if (onScrapeFinish) {
            onScrapeFinish(parsedQuestions);
          }
        }
      } catch (err: unknown) {
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
    };
  }, [enabled, onScrapeFinish]);

  return {
    status,
    logs,
    questions,
    reset,
  };
}
