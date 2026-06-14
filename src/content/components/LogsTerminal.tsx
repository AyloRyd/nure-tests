import React, { useEffect, useRef } from "react";
import type { ScrapeProgress } from "../../types";

interface LogsTerminalProps {
  logs: string[];
  status: ScrapeProgress["status"];
}

export const LogsTerminal: React.FC<LogsTerminalProps> = ({ logs, status }) => {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex-1 bg-slate-950/50 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-y-auto space-y-1">
      {logs.map((log, i) => (
        <div key={i} className="leading-relaxed pl-2">
          {log}
        </div>
      ))}
      <div ref={logsEndRef} />
      {status === "scraping" && (
        <div className="flex items-center gap-1.5 text-indigo-400 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
          Scraping in progress...
        </div>
      )}
    </div>
  );
};
