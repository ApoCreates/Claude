"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

// Clean, exam-quality math rendering (vectors, fractions, subscripts) — the
// same crisp look as the reference. Self-contained: KaTeX ships its own fonts,
// no external network.
export function MathBlock({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: true });
  // dir="ltr" + left align keeps equations correct even inside Arabic (RTL) text.
  return (
    <div dir="ltr" className="katex-block my-1 overflow-x-auto text-left" dangerouslySetInnerHTML={{ __html: html }} />
  );
}

export function MathInline({ tex }: { tex: string }) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: false });
  return <span dir="ltr" className="inline-block" dangerouslySetInnerHTML={{ __html: html }} />;
}

// Renders a paragraph that may contain inline math wrapped in $...$.
// e.g. "Using $\\vec F = m\\vec a$: the car accelerates."
export function MathText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <p className={className}>
      {parts.map((p, i) =>
        p.startsWith("$") && p.endsWith("$") && p.length > 2 ? (
          <MathInline key={i} tex={p.slice(1, -1)} />
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </p>
  );
}
