"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getSubmissionById } from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  Code,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Database,
  Trophy,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import styles from "./styles.module.scss";

interface SubmissionDetail {
  _id: string;
  problemId: {
    _id: string;
    title: string;
    rank: string;
    description?: string;
  };
  language: string;
  code: string;
  status: string;
  score: number;
  passedTestCases: number;
  totalTestCases: number;
  submittedAt: string;
  totalExecutionTime: number;
  memoryUsed: number;
  testResults: Array<{
    testCaseIndex: number;
    passed: boolean;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    executionTime: number;
    isHidden: boolean;
    error?: string;
  }>;
}

const SubmissionDetailPage = () => {
  const params = useParams();
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHiddenTests, setShowHiddenTests] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const response = await getSubmissionById(submissionId);

        if (response.success && response.data) {
          setSubmission(response.data);
        } else {
          setError(response.error?.message || "Failed to load submission");
        }
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle size={20} />;
      case "partial":
        return <AlertCircle size={20} />;
      default:
        return <XCircle size={20} />;
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

  if (loading) {
    return (
      <div className={styles.submissionDetailContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className={styles.submissionDetailContainer}>
        <div className={styles.errorContainer}>
          <XCircle className={styles.errorIcon} />
          <h2 className={styles.errorTitle}>Error Loading Submission</h2>
          <p className={styles.errorText}>{error}</p>
          <Link href="/submissions" className={styles.backButton}>
            <ArrowLeft size={16} />
            Back to Submissions
          </Link>
        </div>
      </div>
    );
  }

  const visibleTests = submission.testResults.filter((test) => !test.isHidden);
  const hiddenTests = submission.testResults.filter((test) => test.isHidden);

  return (
    <div className={styles.submissionDetailContainer}>
      <div className={styles.contentWrapper}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.headerSection}
        >
          <Link href="/submissions" className={styles.backLink}>
            <ArrowLeft size={16} />
            Back to Submissions
          </Link>

          <div className={styles.problemHeader}>
            <span
              className={`${styles.rankBadge} ${getRankClass(
                submission.problemId.rank
              )}`}
            >
              {submission.problemId.rank}
            </span>
            <h1 className={styles.problemTitle}>
              {submission.problemId.title}
            </h1>
          </div>

          <div className={styles.problemMeta}>
            <div className={styles.metaItem}>
              <Calendar size={16} />
              {new Date(submission.submittedAt).toLocaleString()}
            </div>
            <div className={styles.metaItem}>
              <Code size={16} />
              {submission.language.toUpperCase()}
            </div>
            <div className={styles.metaItem}>
              <Target size={16} />
              {submission.passedTestCases}/{submission.totalTestCases} test
              cases passed
            </div>
          </div>
        </motion.div>

        {/* Status and Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={styles.statusGrid}
        >
          <div className={styles.statusCard}>
            <div className={styles.statusContent}>
              <div>
                <p className={styles.statusLabel}>Status</p>
                <div className={`${styles.statusValue} ${styles.status}`}>
                  <div
                    className={`${styles.statusBadge} ${getStatusClass(
                      submission.status
                    )}`}
                  >
                    {getStatusIcon(submission.status)}
                    {submission.status.replace("_", " ").toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.statusCard} ${styles.scoreCard}`}>
            <div className={styles.statusContent}>
              <div>
                <p className={styles.statusLabel}>Score</p>
                <p className={`${styles.statusValue} ${styles.score}`}>
                  {submission.score}%
                </p>
              </div>
              <Trophy className={`${styles.statusIcon} ${styles.trophy}`} />
            </div>
          </div>

          <div className={styles.statusCard}>
            <div className={styles.statusContent}>
              <div>
                <p className={styles.statusLabel}>Performance</p>
                <div className={`${styles.statusValue} ${styles.performance}`}>
                  <div className={styles.perfStats}>
                    <div className={styles.perfItem}>
                      <Clock size={14} />
                      <span>{submission.totalExecutionTime}ms</span>
                    </div>
                    <div className={styles.perfItem}>
                      <Database size={14} />
                      <span>{submission.memoryUsed}MB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={styles.codeSection}
        >
          <h2 className={styles.codeTitle}>Submitted Code</h2>
          <div className={styles.codeContainer}>
            <pre>
              <code>{submission.code}</code>
            </pre>
          </div>
        </motion.div>

        {/* Test Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={styles.testResultsSection}
        >
          <div className={styles.testResultsHeader}>
            <h2 className={styles.testResultsTitle}>Test Results</h2>
            {hiddenTests.length > 0 && (
              <button
                onClick={() => setShowHiddenTests(!showHiddenTests)}
                className={styles.toggleButton}
              >
                {showHiddenTests ? <EyeOff size={16} /> : <Eye size={16} />}
                {showHiddenTests ? "Hide" : "Show"} Hidden Tests (
                {hiddenTests.length})
              </button>
            )}
          </div>

          {/* Visible Test Cases */}
          {visibleTests.length > 0 && (
            <div className={styles.testSection}>
              <h3 className={styles.sectionTitle}>Public Test Cases</h3>
              <div className={styles.testCasesList}>
                {visibleTests.map((test) => (
                  <div
                    key={test.testCaseIndex}
                    className={`${styles.testCase} ${
                      test.passed ? styles.passed : styles.failed
                    }`}
                  >
                    <div className={styles.testCaseHeader}>
                      <div className={styles.testCaseInfo}>
                        {test.passed ? (
                          <CheckCircle size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                        <span className={styles.testCaseTitle}>
                          Test Case {test.testCaseIndex + 1}
                        </span>
                      </div>
                      <div className={styles.testCaseTime}>
                        <Clock size={14} />
                        {test.executionTime}ms
                      </div>
                    </div>

                    <div className={styles.testCaseDetails}>
                      <div className={styles.testCaseDetail}>
                        <p className={styles.detailLabel}>Input:</p>
                        <div
                          className={`${styles.detailValue} ${styles.input}`}
                        >
                          <pre>{test.input || "No input"}</pre>
                        </div>
                      </div>
                      <div className={styles.testCaseDetail}>
                        <p className={styles.detailLabel}>Expected Output:</p>
                        <div
                          className={`${styles.detailValue} ${styles.expected}`}
                        >
                          <pre>{test.expectedOutput}</pre>
                        </div>
                      </div>
                      <div className={styles.testCaseDetail}>
                        <p className={styles.detailLabel}>Your Output:</p>
                        <div
                          className={`${styles.detailValue} ${styles.actual} ${
                            test.passed ? styles.correct : styles.incorrect
                          }`}
                        >
                          <pre>{test.actualOutput || "No output"}</pre>
                        </div>
                      </div>
                    </div>

                    {test.error && (
                      <div className={styles.testCaseError}>
                        <p className={styles.errorLabel}>Error:</p>
                        <div className={styles.errorValue}>
                          <pre>{test.error}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden Test Cases */}
          {showHiddenTests && hiddenTests.length > 0 && (
            <div className={styles.testSection}>
              <h3 className={styles.sectionTitle}>Hidden Test Cases</h3>
              <div className={styles.testCasesList}>
                {hiddenTests.map((test) => (
                  <div
                    key={test.testCaseIndex}
                    className={`${styles.testCase} ${styles.hiddenTestCase} ${
                      test.passed ? styles.passed : styles.failed
                    }`}
                  >
                    <div className={styles.testCaseHeader}>
                      <div className={styles.testCaseInfo}>
                        {test.passed ? (
                          <CheckCircle size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                        <span className={styles.testCaseTitle}>
                          Hidden Test Case {test.testCaseIndex + 1}
                        </span>
                      </div>
                      <div className={styles.testCaseTime}>
                        <Clock size={14} />
                        {test.executionTime}ms
                      </div>
                    </div>

                    <p className={styles.hiddenInfo}>
                      {test.passed ? "✓ Passed" : "✗ Failed"} - Input/Output
                      hidden for security
                    </p>

                    {test.error && (
                      <div className={styles.testCaseError}>
                        <p className={styles.errorLabel}>Error:</p>
                        <div className={styles.errorValue}>
                          <pre>{test.error}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission.testResults.length === 0 && (
            <div className={styles.emptyTests}>
              <p>No test results available</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SubmissionDetailPage;
