"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, FileText, TerminalSquare } from "lucide-react";
import styles from "./ProgrammingSectionNav.module.scss";

type Props = {
  className?: string;
};

export default function ProgrammingSectionNav({ className }: Props) {
  const pathname = usePathname() || "";

  const isProblems =
    pathname === "/programming" ||
    pathname.startsWith("/programming/problemset");
  const isPlayground = pathname.startsWith("/programming/playground");
  const isSubmissions =
    pathname === "/submissions" ||
    pathname.startsWith("/submissions/") ||
    pathname.startsWith("/programming/submissions");

  const wrapClass = className
    ? `${styles.navWrap} ${className}`
    : styles.navWrap;

  return (
    <div className={wrapClass}>
      <div className={styles.nav}>
        <Link
          href="/programming"
          className={`${styles.link} ${isProblems ? styles.active : ""}`}
        >
          <ListChecks size={16} className={styles.icon} />
          Problems
        </Link>

        <Link
          href="/programming/submissions"
          className={`${styles.link} ${isSubmissions ? styles.active : ""}`}
        >
          <FileText size={16} className={styles.icon} />
          My Submissions
        </Link>

        <Link
          href="/programming/playground"
          className={`${styles.link} ${isPlayground ? styles.active : ""}`}
        >
          <TerminalSquare size={16} className={styles.icon} />
          Playground
        </Link>
      </div>
    </div>
  );
}
