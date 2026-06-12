import React from 'react';
import type { Question } from '../../types';

interface OutputViewerProps {
  questions: Question[];
  outputFormat: 'standard' | 'gpt';
  onChangeFormat: (format: 'standard' | 'gpt') => void;
  outputText: string;
}

export const OutputViewer: React.FC<OutputViewerProps> = ({
  questions,
  outputFormat,
  onChangeFormat,
  outputText,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 mt-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
          Parsed Output ({questions.length} questions)
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => onChangeFormat('standard')}
            className={`text-[10px] px-2 py-0.5 rounded transition cursor-pointer border ${
              outputFormat === 'standard'
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 font-semibold'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => onChangeFormat('gpt')}
            className={`text-[10px] px-2 py-0.5 rounded transition cursor-pointer border ${
              outputFormat === 'gpt'
                ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 font-semibold'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            GPT Prompt
          </button>
        </div>
      </div>

      <textarea
        readOnly
        value={outputText}
        className="flex-1 w-full bg-slate-950/70 border border-slate-800/60 rounded-lg p-3 font-mono text-[10px] text-slate-300 resize-none focus:outline-none focus:border-slate-700"
      />
    </div>
  );
};
