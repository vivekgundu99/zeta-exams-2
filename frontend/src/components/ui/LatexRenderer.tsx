'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  text: string;
  className?: string;
}

export default function LatexRenderer({ text, className = '' }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !text) return;

    try {
      // Process the text to find and render LaTeX
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

  // Handle different LaTeX formats:
  // 1. latex:formula (inline)
  // 2. $$formula$$ (display mode)
  // 3. $formula$ (inline mode)
  // 4. \n for newlines
  
  let processed = text;

  // Replace \n with <br />
  processed = processed.replace(/\\n/g, '<br />');
  processed = processed.replace(/\n/g, '<br />');

  // Handle display mode $$...$$
  processed = processed.replace(/\$\$([^\$]+)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { 
        displayMode: true,
        throwOnError: false,
        trust: true
      });
    } catch (e) {
      return match;
    }
  });

  // Handle inline mode $...$
  processed = processed.replace(/\$([^\$]+)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { 
        displayMode: false,
        throwOnError: false,
        trust: true
      });
    } catch (e) {
      return match;
    }
  });

  // Handle latex:formula format
  processed = processed.replace(/latex:([^\s,;.!?]+)/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { 
        displayMode: false,
        throwOnError: false,
        trust: true
      });
    } catch (e) {
      return match;
    }
  });

  return processed;
}

// Helper component for rendering options with LaTeX
export function LatexOption({ text, label }: { text: string; label?: string }) {
  return (
    <div className="flex items-start gap-2">
      {label && <span className="font-semibold">{label}:</span>}
      <LatexRenderer text={text} className="flex-1" />
    </div>
  );
}