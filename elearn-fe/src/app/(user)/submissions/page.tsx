"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getUserSubmissions, getUserSubmissionStats } from "@/lib/api";
import {
  Trophy,
  Clock,
  Code,
  Target,
  ChevronRight,
  Filter,
  Calendar,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import ProgrammingSectionNav from "@/components/programming/ProgrammingSectionNav";
import styles from "./styles.module.scss";

interface Submission {
  _id: string;
  problemId: {
    _id: string;
    title: string;
    rank: string;
  };
  language: string;
  status: string;
  score: number;
  passedTestCases: number;
  totalTestCases: number;
  submittedAt: string;
}

interface SubmissionStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  averageScore: number;
  maxScore: number;
  problemsSolved: number;
  statusBreakdown: Array<{
    _id: string;
    count: number;
  }>;
  recentSubmissions: Submission[];
}

const SubmissionsPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<SubmissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    language: "",
    sort: "newest",
  });

  const fetchSubmissions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getUserSubmissions(page, 10, filters);

      if (response.success && response.data) {
        setSubmissions(response.data.submissions);
        setCurrentPage(response.data.pagination.currentPage);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError(response.error?.message || "Failed to load submissions");
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getUserSubmissionStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSubmissions(1);
  }, [filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle size={16} />;
      case "partial":
        return <AlertCircle size={16} />;
      default:
        return <XCircle size={16} />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "accepted":
        return styles.accepted;
      case "partial":
        return styles.partial;
      default:
        return styles.wrong;
    }
  };

  const getRankClass = (rank: string) => {
    switch (rank) {
      case "S":
        return styles.rankS;
      case "A":
        return styles.rankA;
      case "B":
        return styles.rankB;
      case "C":
        return styles.rankC;
      case "D":
        return styles.rankD;
      default:
        return styles.rankS;
    }
  };

  if (loading && !submissions.length) {
    return (
      <div className={styles.submissionsContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.submissionsContainer} style={{ paddingTop: "0px" }}>
      <div className={styles.contentWrapper} style={{ paddingTop: "0px" }}>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem",
            marginTop: "0px",
            paddingTop: "0px",
          }}
        >
          <ProgrammingSectionNav />
        </div>
        {/* Statistics Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={styles.statsGrid}
          >
            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Total Submissions</p>
                  <p className={`${styles.statValue} ${styles.total}`}>
                    {stats.totalSubmissions}
                  </p>
                </div>
                <Code className={`${styles.statIcon} ${styles.blue}`} />
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Accepted</p>
                  <p className={`${styles.statValue} ${styles.accepted}`}>
                    {stats.acceptedSubmissions}
                  </p>
                </div>
                <CheckCircle className={`${styles.statIcon} ${styles.green}`} />
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Problems Solved</p>
                  <p className={`${styles.statValue} ${styles.solved}`}>
                    {stats.problemsSolved}
                  </p>
                </div>
                <Trophy className={`${styles.statIcon} ${styles.purple}`} />
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statContent}>
                <div className={styles.statInfo}>
                  <p className={styles.statLabel}>Average Score</p>
                  <p className={`${styles.statValue} ${styles.average}`}>
                    {stats.averageScore}%
                  </p>
                </div>
                <Target className={`${styles.statIcon} ${styles.yellow}`} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.filtersContainer}
        >
          <div className={styles.filtersContent}>
            <div className={styles.filterLabel}>
              <Filter size={20} />
              <span>Filters:</span>
            </div>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className={styles.filterSelect}
            >
              <option value="">All Status</option>
              <option value="accepted">Accepted</option>
              <option value="partial">Partial</option>
              <option value="wrong_answer">Wrong Answer</option>
              <option value="runtime_error">Runtime Error</option>
              <option value="compile_error">Compile Error</option>
            </select>

            <select
              value={filters.language}
              onChange={(e) =>
                setFilters({ ...filters, language: e.target.value })
              }
              className={styles.filterSelect}
            >
              <option value="">All Languages</option>
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>

            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className={styles.filterSelect}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score">Best Score</option>
              <option value="status">By Status</option>
            </select>
          </div>
        </motion.div>

        {/* Submissions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={styles.submissionsCard}
        >
          {submissions.length === 0 ? (
            <div className={styles.emptyState}>
              <Code className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No submissions yet</h3>
              <p className={styles.emptyText}>
                Start solving problems to see your submission history here.
              </p>
              <Link href="/programming" className={styles.emptyButton}>
                Browse Problems <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div>
              {submissions.map((submission, index) => (
                <motion.div
                  key={submission._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={styles.submissionItem}
                >
                  <Link
                    href={`/submissions/${submission._id}`}
                    className={styles.submissionLink}
                  >
                    <div className={styles.submissionContent}>
                      <div className={styles.submissionLeft}>
                        <div className={styles.submissionHeader}>
                          <span
                            className={`${styles.rankBadge} ${getRankClass(
                              submission.problemId.rank
                            )}`}
                          >
                            {submission.problemId.rank}
                          </span>
                          <h3 className={styles.problemTitle}>
                            {submission.problemId.title}
                          </h3>
                        </div>

                        <div className={styles.submissionMeta}>
                          <div className={styles.metaItem}>
                            <Calendar size={14} />
                            {new Date(
                              submission.submittedAt
                            ).toLocaleDateString()}
                          </div>
                          <div className={styles.metaItem}>
                            <Code size={14} />
                            {submission.language.toUpperCase()}
                          </div>
                          <div className={styles.metaItem}>
                            <Target size={14} />
                            {submission.passedTestCases}/
                            {submission.totalTestCases} cases
                          </div>
                        </div>
                      </div>

                      <div className={styles.submissionRight}>
                        <div className={styles.scoreSection}>
                          <div className={styles.score}>
                            {submission.score}%
                          </div>
                          <div
                            className={`${styles.statusBadge} ${getStatusClass(
                              submission.status
                            )}`}
                          >
                            {getStatusIcon(submission.status)}
                            {submission.status.replace("_", " ").toUpperCase()}
                          </div>
                        </div>
                        <ChevronRight
                          className={styles.chevronIcon}
                          size={20}
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={styles.pagination}
          >
            <div className={styles.paginationControls}>
              <button
                onClick={() => fetchSubmissions(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
                Previous
              </button>

              <span className={styles.paginationInfo}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => fetchSubmissions(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SubmissionsPage;
