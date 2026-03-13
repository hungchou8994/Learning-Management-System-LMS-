"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProgrammingSectionNav from "@/components/programming/ProgrammingSectionNav";
import {
  Search,
  Plus,
  Code,
  Clock,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAllProblems,
  getProblemStats,
  Problem,
  ProblemStats,
} from "@/lib/api";
import styles from "./styles.module.scss";

const ProblemsetPage: React.FC = () => {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<ProblemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRank, setSelectedRank] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [showTutorialOnly, setShowTutorialOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "rank">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const allLanguages = ["cpp", "python", "java"];

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError("");

      // Build filters object
      const filters: any = {};
      if (selectedRank !== "all") filters.rank = selectedRank;
      if (selectedLanguage !== "all") filters.language = selectedLanguage;
      if (showTutorialOnly) filters.tutorial = true;
      if (searchTerm.trim()) filters.search = searchTerm.trim();
      if (sortBy) filters.sort = sortBy;

      const response = await getAllProblems(currentPage, 10, filters);

      if (response.success && response.data) {
        setProblems(response.data.problems);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError(response.error?.message || "Failed to fetch problems");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error fetching problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getProblemStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [
    currentPage,
    selectedRank,
    selectedLanguage,
    showTutorialOnly,
    sortBy,
    searchTerm,
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  // Debounce search input (avoid firing on every keystroke)
  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      setSearchTerm(searchInput);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const getRankColor = (rank: string) => {
    const colors = {
      S: "#ef4444", // red
      A: "#f97316", // orange
      B: "#eab308", // yellow
      C: "#22c55e", // green
      D: "#3b82f6", // blue
    };
    return colors[rank as keyof typeof colors] || "#6b7280";
  };

  const formatLanguage = (lang: string) => {
    const langMap = {
      cpp: "C++",
      python: "Python",
      java: "Java",
    };
    return langMap[lang as keyof typeof langMap] || lang;
  };

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const headerSubtitle = useMemo(() => {
    const total = stats?.totalProblems || 0;
    const standard = stats?.regularProblems || 0;
    const tutorial = stats?.tutorialProblems || 0;
    return `${total} problems • ${standard} standard • ${tutorial} tutorials`;
  }, [stats]);

  return (
    <div className={styles.problemsetContainer}>
      <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <ProgrammingSectionNav />
      </div>

      {/* Stats */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <Code className={styles.statIcon} />
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              {stats?.totalProblems || 0}
            </span>
            <span className={styles.statLabel}>Total Problems</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <TrendingUp className={styles.statIcon} />
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              {stats?.regularProblems || 0}
            </span>
            <span className={styles.statLabel}>Standard Problems</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Users className={styles.statIcon} />
          <div className={styles.statContent}>
            <span className={styles.statNumber}>
              {stats?.tutorialProblems || 0}
            </span>
            <span className={styles.statLabel}>Interactive Tutorials</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search problems..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={selectedRank}
            onChange={(e) => setSelectedRank(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Ranks</option>
            <option value="S">Rank S</option>
            <option value="A">Rank A</option>
            <option value="B">Rank B</option>
            <option value="C">Rank C</option>
            <option value="D">Rank D</option>
          </select>

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Languages</option>
            {allLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {formatLanguage(lang)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "newest" | "oldest" | "rank")
            }
            className={styles.filterSelect}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rank">By Rank</option>
          </select>
        </div>

        <label className={styles.checkboxContainer}>
          <input
            type="checkbox"
            checked={showTutorialOnly}
            onChange={(e) => setShowTutorialOnly(e.target.checked)}
            className={styles.checkbox}
          />
          <span className={styles.checkboxLabel}>Tutorial Only</span>
        </label>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <Loader2 className={styles.loadingIcon} size={48} />
          <p>Loading problems...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className={styles.errorState}>
          <AlertCircle className={styles.errorIcon} size={48} />
          <h3>Error loading problems</h3>
          <p>{error}</p>
          <button onClick={fetchProblems} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      )}

      {/* Problems Table */}
      {!loading && !error && problems.length > 0 && (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div className={styles.tableTitle}>Problems</div>
            <div className={styles.tableHint}>
              Click a row to open the problem.
            </div>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Rank</th>
                  <th className={styles.th}>Title</th>
                  <th className={styles.th}>Languages</th>
                  <th className={styles.th}>Type</th>
                  <th className={styles.th}>Created</th>
                  <th className={styles.th}>Author</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((problem: Problem) => (
                  <tr
                    key={problem._id}
                    className={styles.tr}
                    onClick={() =>
                      router.push(`/programming/problem/${problem._id}`)
                    }
                  >
                    <td className={styles.td}>
                      <span
                        className={styles.rankPill}
                        style={{
                          borderColor: getRankColor(problem.rank),
                          color: getRankColor(problem.rank),
                        }}
                      >
                        {problem.rank}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.problemName}>{problem.title}</div>
                      <div className={styles.problemDesc}>
                        {problem.description}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.langList}>
                        {problem.supportedLanguages.map((lang: string) => (
                          <span key={lang} className={styles.langPill}>
                            {formatLanguage(lang)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.td}>
                      {problem.isInteractiveTutorial ? (
                        <span className={styles.badgeTutorial}>Tutorial</span>
                      ) : (
                        <span className={styles.badgeStandard}>Standard</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.metaInline}>
                        <Clock size={14} />
                        {new Date(problem.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.metaInline}>
                        <Users size={14} />
                        {problem.author.firstName || problem.author.username}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => canPrev && setCurrentPage((p) => p - 1)}
                disabled={!canPrev}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <div className={styles.pageInfo}>
                Page <b>{currentPage}</b> of <b>{totalPages}</b>
              </div>
              <button
                className={styles.pageBtn}
                onClick={() => canNext && setCurrentPage((p) => p + 1)}
                disabled={!canNext}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && problems.length === 0 && (
        <div className={styles.emptyState}>
          <Code size={64} className={styles.emptyIcon} />
          <h3>No problems found</h3>
          <p>Try adjusting your search criteria or create a new problem.</p>
        </div>
      )}
    </div>
  );
};

export default ProblemsetPage;
