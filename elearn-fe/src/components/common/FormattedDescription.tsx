"use client";

import React from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import styles from "./FormattedDescription.module.scss";

interface FormattedDescriptionProps {
  description: string;
  className?: string;
}

const FormattedDescription: React.FC<FormattedDescriptionProps> = ({
  description,
  className = "",
}) => {
  const formatDescription = (text: string) => {
    // Split text by line breaks first
    const lines = text.split("\n");

    return lines.map((line, lineIndex) => {
      const parts: React.ReactNode[] = [];
      let currentIndex = 0;

      // Find all ${...} patterns in the line.
      // Some seeded content may contain a trailing `$` like `${x} $` or `${x}$`.
      // Consume the optional `$` so it doesn't show up as raw text.
      const mathPattern = /\$\{([^}]+)\}\$?/g;
      let match;

      while ((match = mathPattern.exec(line)) !== null) {
        // Add text before the math
        if (match.index > currentIndex) {
          const textBefore = line.slice(currentIndex, match.index);
          if (textBefore) {
            parts.push(textBefore);
          }
        }

        // Add the math part
        const mathContent = match[1];
        parts.push(
          <InlineMath
            key={`math-${lineIndex}-${match.index}`}
            math={mathContent}
          />
        );

        currentIndex = match.index + match[0].length;
      }

      // Add remaining text after the last math
      if (currentIndex < line.length) {
        const textAfter = line.slice(currentIndex);
        if (textAfter) {
          parts.push(textAfter);
        }
      }

      // If no math was found, just add the whole line
      if (parts.length === 0) {
        parts.push(line);
      }

      return (
        <React.Fragment key={lineIndex}>
          {parts.length > 0 ? parts : line}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`${styles.formattedDescription} ${className}`}>
      {formatDescription(description)}
    </div>
  );
};

export default FormattedDescription;
