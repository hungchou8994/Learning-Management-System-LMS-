"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

type MarkdownViewerProps = {
  markdown?: string | null;
  className?: string;
  /**
   * Compact mode: smaller typography for previews (cards).
   */
  compact?: boolean;
};

export default function MarkdownViewer({
  markdown,
  className,
  compact = false,
}: MarkdownViewerProps) {
  const content = (markdown ?? "").trim();
  if (!content) return null;

  const base =
    "text-gray-700 leading-relaxed " + (compact ? "text-sm" : "text-base");

  return (
    <div className={`${base} ${className ?? ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        skipHtml
        components={{
          h1: ({ children }) => (
            <h1 className={`${compact ? "text-base" : "text-2xl"} font-bold mt-3 mb-2`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`${compact ? "text-base" : "text-xl"} font-semibold mt-3 mb-2`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`${compact ? "text-sm" : "text-lg"} font-semibold mt-3 mb-2`}>
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-0">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 italic text-gray-600 my-2">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="font-mono text-[0.95em] bg-gray-100 border border-gray-200 rounded px-1 py-[1px]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="font-mono text-sm bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto my-2">
              {children}
            </pre>
          ),
          // KaTeX output
          span: ({ className, children, ...props }) => (
            <span className={className} {...props}>
              {children}
            </span>
          ),
          div: ({ className, children, ...props }) => (
            <div className={className} {...props}>
              {children}
            </div>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border border-gray-200 text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-200 bg-gray-50 text-left px-2 py-1 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-200 px-2 py-1">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}


