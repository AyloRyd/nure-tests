import { useState, useEffect } from 'react';
import type { Question, ScrapeProgress } from '../../types';
import { runScraper } from '../../core/scraper';

export function useScraper(onScrapeFinish?: (questions: Question[]) => void) {
  const [status, setStatus] = useState<ScrapeProgress['status']>('scraping');
  const [logs, setLogs] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    let active = true;

    const run = async () => {
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
          }
        );

        if (active) {
          setQuestions(parsedQuestions);
          setStatus('completed');
          if (onScrapeFinish) {
            onScrapeFinish(parsedQuestions);
          }
        }
      } catch (err: unknown) {
        if (active) {
          setStatus('error');
          const errMsg = err instanceof Error ? err.message : String(err);
          setLogs((prev) => [...prev, `Scrape failed: ${errMsg}`]);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [onScrapeFinish]);

  return {
    status,
    logs,
    questions,
  };
}
