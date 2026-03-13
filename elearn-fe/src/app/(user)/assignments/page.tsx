"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import styles from "./styles.module.scss";

interface Assignment {
  id: string;
  status: string;
  grade?: number;
}

interface EnrolledCourse {
  id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  progress?: number;
  status?: string;
  sessions?: Array<{
    lessons: Array<any>;
  }>;
}

interface Course {
  id: string;
  name: string;
  description: string;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  progress: number;
  status: string;
}

const AssignmentsPage = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/enroll`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch enrolled courses");
        }

        const data = await response.json();
        if (data.status === "success") {
          // Transform the enrolled courses data to include assignment counts
          const coursesWithAssignments = await Promise.all(
            (Array.isArray(data.data) ? data.data : []).map(
              async (course: EnrolledCourse) => {
                // Get assignments for the course
                const assignmentsResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/assignment/course/${course.id}`,
                  {
                    credentials: "include",
                  }
                );

                let assignments: Assignment[] = [];
                if (assignmentsResponse.ok) {
                  const assignmentsData = await assignmentsResponse.json();
                  if (
                    assignmentsData.status === "success" &&
                    Array.isArray(assignmentsData.data)
                  ) {
                    assignments = assignmentsData.data;
                  }
                }

                // Calculate assignment counts
                const totalAssignments = assignments.length;
                const completedAssignments = assignments.filter(
                  (a) => a.status === "completed" || a.status === "graded"
                ).length;
                const pendingAssignments =
                  totalAssignments - completedAssignments;

                return {
                  id: course.id,
                  name: course.name,
                  description:
                    course.shortDescription || course.description || "",
                  totalAssignments,
                  completedAssignments,
                  pendingAssignments,
                  progress: course.progress || 0,
                  status: course.status || "active",
                };
              }
            )
          );

          setCourses(coursesWithAssignments);
        } else {
          throw new Error(data.message || "Failed to fetch enrolled courses");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading courses...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>⚠️</div>
              <p className={styles.errorMessage}>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Ensure we're working with an array and calculate totals
  const coursesArray = Array.isArray(courses) ? courses : [];
  const totalAssignments = coursesArray.reduce(
    (sum, course) => sum + (course?.totalAssignments || 0),
    0
  );
  const totalCompleted = coursesArray.reduce(
    (sum, course) => sum + (course?.completedAssignments || 0),
    0
  );

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <motion.div
            className={styles.coursesContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.coursesHeader}>
              <div className={styles.coursesTitle}>
                <h1>My Courses</h1>
                <div className={styles.coursesMeta}>
                  <span className={styles.metaBadge}>
                    <i className="fas fa-book"></i>
                    Total Courses: {coursesArray.length}
                  </span>
                  <span className={styles.metaBadge}>
                    <i className="fas fa-list-ol"></i>
                    Total Assignments: {totalAssignments}
                  </span>
                  <span className={styles.metaBadge}>
                    <i className="fas fa-check-circle"></i>
                    Completed: {totalCompleted}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.coursesContent}>
              <div className={styles.coursesList}>
                {coursesArray.map((course) => (
                  <motion.div
                    key={course.id}
                    className={styles.courseCard}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // window.open(`/assignments/course/${course.id}`, "_blank");
                      router.push(`/assignments/course/${course.id}`);
                    }}
                  >
                    <div className={styles.courseIcon}>
                      <i className="fas fa-book"></i>
                    </div>
                    <div className={styles.courseInfo}>
                      <h2 className={styles.courseTitle}>{course.name}</h2>
                      <p className={styles.courseDescription}>
                        {course.description}
                      </p>
                      <div className={styles.courseMeta}>
                        <span
                          className={`${styles.courseBadge} ${styles.assignments}`}
                        >
                          <i className="fas fa-list-ol"></i>
                          {course.totalAssignments} assignments
                        </span>
                        {course.completedAssignments > 0 && (
                          <span
                            className={`${styles.courseBadge} ${styles.completed}`}
                          >
                            <i className="fas fa-check-circle"></i>
                            {course.completedAssignments} completed
                          </span>
                        )}
                        {course.pendingAssignments > 0 && (
                          <span
                            className={`${styles.courseBadge} ${styles.pending}`}
                          >
                            <i className="fas fa-clock"></i>
                            {course.pendingAssignments} pending
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.courseArrow}>
                      <i className="fas fa-chevron-right"></i>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentsPage;
