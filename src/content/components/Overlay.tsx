import React, { useState } from "react";
import type { Question } from "../../types";
import { useScraper } from "../hooks/useScraper";
import { formatQuizData, formatForGPT } from "../../core/formatter";
import { OverlayHeader } from "./OverlayHeader";
import { LogsTerminal } from "./LogsTerminal";
import { OutputViewer } from "./OutputViewer";
import { OverlayFooter } from "./OverlayFooter";

interface OverlayProps {
  onClose: () => void;
  onScrapeFinish: (questions: Question[]) => void;
}

export const Overlay: React.FC<OverlayProps> = ({
  onClose,
  onScrapeFinish,
}) => {
  const { status, logs, questions } = useScraper(onScrapeFinish);
  const [outputFormat, setOutputFormat] = useState<"standard" | "gpt">(
    "standard",
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getOutputText = () => {
    if (outputFormat === "gpt") {
      return formatForGPT(questions);
    }
    return formatQuizData(questions);
  };

  const handleCopy = () => {
    const text = getOutputText();
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyFeedback("Copied!");
        setTimeout(() => setCopyFeedback(null), 2000);
      })
      .catch((err: unknown) => {
        console.error("Clipboard copy failed:", err);
      });
  };

  return (
    <div
      className="fixed top-3 right-3 w-[420px] bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl flex flex-col font-sans text-slate-100 z-[99999] overflow-hidden"
      style={{
        border: "1px solid #64748b",
        ...(isCollapsed ? {} : { height: "85vh" }),
      }}
    >
      <OverlayHeader
        status={status}
        onClose={onClose}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {!isCollapsed && (
        <>
          <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col justify-between min-h-0">
            <LogsTerminal logs={logs} status={status} />

            {status === "completed" && (
              <OutputViewer
                questions={questions}
                outputFormat={outputFormat}
                onChangeFormat={setOutputFormat}
                outputText={getOutputText()}
              />
            )}
          </div>

          {status === "completed" && (
            <OverlayFooter onCopy={handleCopy} copyFeedback={copyFeedback} />
          )}
        </>
      )}
    </div>
  );
};
