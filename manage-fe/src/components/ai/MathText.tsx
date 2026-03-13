"use client";

import katex from "katex";
import type React from "react";

type Part =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; displayMode: boolean };

const MATH_PATTERN =
  /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?:[^$\\]|\\.)+?\$)/g;

function splitMath(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = MATH_PATTERN.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > last) parts.push({ kind: "text", value: text.slice(last, start) });

    const token = m[0];
    const isBlock = token.startsWith("$$") || token.startsWith("\\[");
    const expr = token.startsWith("$$")
      ? token.slice(2, -2)
      : token.startsWith("\\[")
        ? token.slice(2, -2)
        : token.startsWith("\\(")
          ? token.slice(2, -2)
          : token.startsWith("$")
            ? token.slice(1, -1)
            : token;

    parts.push({ kind: "math", value: expr, displayMode: isBlock });
    last = end;
  }
  if (last < text.length) parts.push({ kind: "text", value: text.slice(last) });
  return parts;
}

function prettifyTextPart(s: string) {
  // Keep existing newlines, but add helpful breaks for long paragraphs.
  // We do NOT touch math tokens; only plain text parts.
  let out = s.replace(/\r\n/g, "\n");

  // Common list separators
  out = out.replace(/:\s+/g, ":\n");
  out = out.replace(/;\s+/g, ";\n");

  // Split into new lines by sentence endings (Vietnamese-friendly heuristic)
  // Avoid inserting too many breaks: only split when there is a space after punctuation.
  out = out.replace(/([.!?])\s+(?=\S)/g, "$1\n");

  // Normalize excessive empty lines
  out = out.replace(/\n{3,}/g, "\n\n");
  return out;
}

function prettifyPreservingMath(text: string): Part[] {
  const parts = splitMath(text);
  return parts.map((p) => (p.kind === "text" ? { ...p, value: prettifyTextPart(p.value) } : p));
}

function renderKatex(expr: string, displayMode: boolean) {
  try {
    return katex.renderToString(expr, {
      displayMode,
      throwOnError: false,
      strict: false,
      output: "html",
    });
  } catch {
    return "";
  }
}

export function MathText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = prettifyPreservingMath(text);
  return (
    <span className={className}>
      {parts.map((p, idx) => {
        if (p.kind === "text") {
          return (
            <span key={idx}>
              {p.value}
            </span>
          );
        }
        const html = renderKatex(p.value, p.displayMode);
        if (!html) {
          return (
            <span key={idx} className="font-mono">
              {p.displayMode ? `\\[${p.value}\\]` : `\\(${p.value}\\)`}
            </span>
          );
        }
        return (
          <span
            key={idx}
            className={p.displayMode ? "block my-2" : "inline"}
            dangerouslySetInnerHTML={{ __html: html } as { __html: string }}
          />
        );
      })}
    </span>
  );
}


