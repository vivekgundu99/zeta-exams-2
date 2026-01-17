'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  text: string;
  className?: string;
}

export default function LatexRenderer({
  text,
  className = '',
}: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    try {
      const processedHTML = processLatexText(text);
      containerRef.current.innerHTML = processedHTML;
    } catch (error) {
      console.error('LaTeX rendering error:', error);
      containerRef.current.textContent = text;
    }
  }, [text]);

  return <div ref={containerRef} className={className} />;
}

function processLatexText(text: string): string {
  if (!text) return '';

  let processed = text;

  // ✅ Handle newlines first
  processed = processed.replace(/\\n/g, '<br />');
  processed = processed.replace(/\n/g, '<br />');

  // ✅ FIXED: $$ display math (NO 's' FLAG → ES2017 SAFE)
  processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
        strict: false,
      });
    } catch {
      return match;
    }
  });

  // ✅ Inline math $...$
  processed = processed.replace(/\$(.+?)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
        strict: false,
      });
    } catch {
      return match;
    }
  });

  // ✅ latex:formula format
  processed = processed.replace(/latex:([^\s,;.!?<>]+)/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
        strict: false,
      });
    } catch {
      return match;
    }
  });

  return processed;
}

export function LatexOption({
  text,
  label,
}: {
  text: string;
  label?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      {label && <span className="font-semibold">{label}:</span>}
      <LatexRenderer text={text} className="flex-1" />
    </div>
  );
}
