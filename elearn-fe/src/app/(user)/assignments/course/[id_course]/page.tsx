"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import styles from "../../styles.module.scss";

interface Assignment {
  id: string;
  name: string;
  description: string;
  ratio: number;
  questions: Array<any>;
  sessionId: string;
  sessionName: string;
  status?: "pending" | "completed" | "graded";
  grade?: number;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  duration: number;
  deadline: string;
}

interface Course {
  id: string;
  name: string;
  description: string;
}

const CourseAssignmentsPage = ({
  params,
}: {
  params: { id_course: string };
}) => {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourseAndAssignments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch course details
        const courseResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/course/${params.id_course}`,
          {
            credentials: "include",
          }
        );

        if (!courseResponse.ok) {
          throw new Error("Failed to fetch course details");
        }

        const courseData = await courseResponse.json();
        setCourse(courseData.data);

        // Fetch assignments for the course
        const assignmentsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/assignment/course/${params.id_course}`,
          {
            credentials: "include",
          }
        );

        if (!assignmentsResponse.ok) {
          throw new Error("Failed to fetch assignments");
        }

        const assignmentsData = await assignmentsResponse.json();
        console.log("Assignments data:", assignmentsData.data); // Debug log
        setAssignments(assignmentsData.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndAssignments();
  }, [params.id_course]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const completedAssignments = assignments.filter(
    (a) => a.status === "completed" || a.status === "graded"
  );
  const pendingAssignments = assignments.filter((a) => a.status === "pending");

  console.log("Completed assignments:", completedAssignments); // Debug log
  console.log("Pending assignments:", pendingAssignments); // Debug log

  if (loading) {
    return (
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading course assignments...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>⚠️</div>
              <p className={styles.errorMessage}>
                {error || "Course not found"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <motion.div
            className={styles.assignmentsContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.assignmentsHeader}>
              <div className={styles.assignmentsTitle}>
                <h1>{course.name}</h1>
                <div className={styles.assignmentsMeta}>
                  <span className={styles.metaBadge}>
                    <i className="fas fa-list-ol"></i>
                    Total: {assignments.length}
                  </span>
                  <span className={styles.metaBadge}>
                    <i className="fas fa-check-circle"></i>
                    Completed: {completedAssignments.length}
                  </span>
                  <span className={styles.metaBadge}>
                    <i className="fas fa-clock"></i>
                    Pending: {pendingAssignments.length}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.assignmentsContent}>
              {completedAssignments.length > 0 && (
                <div className={styles.completedSection}>
                  <div className={styles.completedHeader}>
                    <div className={styles.completedIcon}>
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <h2 className={styles.completedTitle}>
                      Completed Assignments
                    </h2>
                    <span className={styles.completedCount}>
                      {completedAssignments.length} completed
                    </span>
                  </div>
                  <div className={styles.assignmentsList}>
                    {completedAssignments.map((assignment) => (
                      <motion.div
                        key={assignment.id}
                        className={styles.assignmentCard}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          router.push(`/assignments/${assignment.id}`)
                        }
                      >
                        <div className={styles.assignmentCardHeader}>
                          <div>
                            <h2 className={styles.assignmentCardTitle}>
                              {assignment.name}
                            </h2>
                            <div className={styles.assignmentCardMeta}>
                              <span
                                className={`${styles.assignmentCardBadge} ${styles.weight}`}
                              >
                                <i className="fas fa-balance-scale"></i>
                                Weight: {assignment.ratio}%
                              </span>
                              <span
                                className={`${styles.assignmentCardBadge} ${styles.questions}`}
                              >
                                <i className="fas fa-list-ol"></i>
                                Questions: {assignment.questions?.length || 0}
                              </span>
                              <span
                                className={`${styles.assignmentCardBadge}`}
                                style={{
                                  color: "#1d4ed8",
                                  backgroundColor: "#dbeafe",
                                }}
                              >
                                <i className="fas fa-clock"></i>
                                Duration: {assignment.duration} minutes
                              </span>
                              <span
                                className={`${styles.assignmentCardBadge} ${styles.status} ${assignment.status}`}
                              >
                                <i
                                  className={`fas fa-${
                                    assignment.status === "completed"
                                      ? "check-circle"
                                      : "star"
                                  }`}
                                ></i>
                                {assignment.status === "completed"
                                  ? "Completed"
                                  : "Graded"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className={styles.assignmentCardDescription}>
                          {assignment.description}
                        </p>

                        <div className={styles.assignmentCardFooter}>
                          <div className={styles.assignmentCardDates}>
                            <span className={styles.assignmentCardDate}>
                              <i className="fas fa-calendar"></i>
                              Due: {formatDate(assignment.deadline)}
                            </span>
                            {assignment.status === "completed" && (
                              <span className={styles.assignmentCardDate}>
                                <i className="fas fa-check"></i>
                                Completed: {formatDate(assignment.updatedAt)}
                              </span>
                            )}
                          </div>
                          <button
                            className={styles.assignmentCardButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/assignments/${assignment.id}`);
                            }}
                          >
                            {assignment.status === "graded"
                              ? "View Grade"
                              : assignment.status === "completed"
                              ? "View Results"
                              : "Start Assignment"}
                            <i className="fas fa-arrow-right"></i>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {pendingAssignments.length > 0 && (
                <div className={styles.courseSection}>
                  <div className={styles.courseHeader}>
                    <div className={styles.courseIcon}>
                      <i className="fas fa-clock"></i>
                    </div>
                    <h2 className={styles.courseTitle}>Pending Assignments</h2>
                    <div className={styles.courseMeta}>
                      <span className={styles.courseBadge}>
                        <i className="fas fa-list-ol"></i>
                        {pendingAssignments.length} assignments
                      </span>
                    </div>
                  </div>
                  <div className={styles.assignmentsList}>
                    {pendingAssignments.map((assignment) => (
                      <motion.div
                        key={assignment.id}
                        className={styles.assignmentCard}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() =>
                          router.push(`/assignments/${assignment.id}`)
                        }
                      >
                        <div className={styles.assignmentCardHeader}>
                          <div>
                            <h2 className={styles.assignmentCardTitle}>
                              {assignment.name}
                            </h2>
                            <div className={styles.assignmentCardMeta}>
                              <span
                                className={`${styles.assignmentCardBadge} ${styles.weight}`}
                              >
                                <i className="fas fa-balance-scale"></i>
                                Weight: {assignment.ratio}%
                              </span>
                              <span
                                className={`${styles.assignmentCardBadge} ${styles.questions}`}
                              >
                                <i className="fas fa-list-ol"></i>
                                Questions: {assignment.questions?.length || 0}
                              </span>
                              <span
                                className={`${styles.assignmentCardBadge}`}
                                style={{
                                  color: "#1d4ed8",
                                  backgroundColor: "#dbeafe",
                                }}
                              >
                                <i className="fas fa-clock"></i>
                                Duration: {assignment.duration} minutes
                              </span>
                              <span
                                className={`${styles.assignmentCardBadge} ${styles.status} ${assignment.status}`}
                              >
                                <i
                                  className={`fas fa-${
                                    assignment.status === "completed"
                                      ? "check-circle"
                                      : "star"
                                  }`}
                                ></i>
                                {assignment.status === "completed"
                                  ? "Completed"
                                  : "Graded"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className={styles.assignmentCardDescription}>
                          {assignment.description}
                        </p>

                        <div className={styles.assignmentCardFooter}>
                          <div className={styles.assignmentCardDates}>
                            <span className={styles.assignmentCardDate}>
                              <i className="fas fa-calendar"></i>
                              Due: {formatDate(assignment.deadline)}
                            </span>
                            {assignment.status === "completed" && (
                              <span className={styles.assignmentCardDate}>
                                <i className="fas fa-check"></i>
                                Completed: {formatDate(assignment.updatedAt)}
                              </span>
                            )}
                          </div>
                          <button
                            className={styles.assignmentCardButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/assignments/${assignment.id}`);
                            }}
                          >
                            {assignment.status === "graded"
                              ? "View Grade"
                              : assignment.status === "completed"
                              ? "View Results"
                              : "Start Assignment"}
                            <i className="fas fa-arrow-right"></i>
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CourseAssignmentsPage;
