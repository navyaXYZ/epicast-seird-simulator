'use client';

import React, { useState } from 'react';
import { FileText, Copy, Check, AlertTriangle, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface PolicyBriefProps {
  brief: string;
  isCollapsed: boolean;
}

export const PolicyBrief: React.FC<PolicyBriefProps> = ({ brief, isCollapsed }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(brief);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Format the raw policy brief markdown string for sleek presentation
  const renderFormattedBrief = (text: string) => {
    const lines = text.split('\n');

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('### ')) {
        return (
          <h2 key={idx} className="text-base font-bold text-teal-300 font-mono tracking-wide mt-2 mb-1">
            {trimmed.replace('### ', '')}
          </h2>
        );
      }
      if (trimmed.startsWith('#### ')) {
        return (
          <h3 key={idx} className="text-sm font-semibold text-white tracking-wide mt-4 mb-2 pb-1 border-b border-slate-800">
            {trimmed.replace('#### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('- **STATUS:**')) {
        return (
          <div
            key={idx}
            className={`p-3 my-2 rounded-lg border font-mono text-xs flex items-center gap-2 ${
              isCollapsed
                ? 'bg-red-950/40 border-red-800 text-red-200'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
            }`}
          >
            {isCollapsed ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
            <span>{trimmed.replace('- **STATUS:**', '').trim()}</span>
          </div>
        );
      }
      if (trimmed.startsWith('- ')) {
        // Bullet point
        const content = trimmed.substring(2);
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 py-0.5 leading-relaxed">
            <span className="text-teal-400 mt-1 shrink-0 font-bold">•</span>
            <div>
              {content.split(/(\*\*.*?\*\*)/g).map((chunk, cIdx) => {
                if (chunk.startsWith('**') && chunk.endsWith('**')) {
                  return (
                    <strong key={cIdx} className="text-slate-100 font-semibold font-mono">
                      {chunk.slice(2, -2)}
                    </strong>
                  );
                }
                return chunk;
              })}
            </div>
          </div>
        );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        // Numbered list item
        return (
          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 py-1 leading-relaxed bg-slate-900/40 p-2 rounded border border-slate-800/60 my-1">
            <span className="text-teal-400 font-mono font-bold">{trimmed.split('.')[0]}.</span>
            <div>
              {trimmed.substring(trimmed.indexOf('.') + 1).split(/(\*\*.*?\*\*)/g).map((chunk, cIdx) => {
                if (chunk.startsWith('**') && chunk.endsWith('**')) {
                  return (
                    <strong key={cIdx} className="text-teal-200 font-semibold">
                      {chunk.slice(2, -2)}
                    </strong>
                  );
                }
                return chunk;
              })}
            </div>
          </div>
        );
      }
      if (trimmed === '') {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Automated Policy Intelligence Brief
          </h2>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-teal-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Brief</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-1 font-sans">
        {renderFormattedBrief(brief)}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span>Computed via EpiCast Coupled Non-Linear Solver (RK4 dt=0.05)</span>
        <span className="flex items-center gap-1 text-teal-400">
          Validated <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
