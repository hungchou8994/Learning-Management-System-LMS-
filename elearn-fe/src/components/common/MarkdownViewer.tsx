"use client";

import React from "react";
import { Inter } from "next/font/google";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import styles from "./MarkdownViewer.module.scss";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

type MarkdownViewerProps = {
  markdown: string;
  className?: string;
};

export default function MarkdownViewer({
  markdown,
  className = "",
}: MarkdownViewerProps) {
  return (
    <div className={`${styles.markdown} ${inter.className} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ children, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isBlock = Boolean(match);

            if (isBlock) {
              return (
                <code className={styles.codeBlock} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <code className={styles.codeInline} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => (
            <pre className={styles.pre} {...props}>
              {children}
            </pre>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className={styles.blockquote} {...props}>
              {children}
            </blockquote>
          ),
        }}
      >
        {markdown || ""}
      </ReactMarkdown>
    </div>
  );
}


