"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import styles from "./styles.module.scss";

interface Question {
  title: string;
  type: "multi_choice" | "assignment";
  orderIndex: number;
  options?: string[];
}

interface Assignment {
  id: string;
  name: string;
  description: string;
  ratio: number;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  sessionId: string;
  courseId: string;
  duration: number;
  deadline: string;
}

interface Answer {
  questionIndex: number;
  answer: string;
}

interface Attempt {
  id: string;
  answers: Answer[];
  grade?: number;
  status: "completed" | "graded";
  submittedAt: string;
  assignmentId: string;
}

const AssignmentPage = () => {
  const params = useParams();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [remainingDuration, setRemainingDuration] = useState<number>(0);

  // Function to save assignment state
  const saveAssignmentState = (startTime: number, currentAnswers: Answer[]) => {
    localStorage.setItem(
      `assignment_${params.assignment_id}`,
      JSON.stringify({
        startTime,
        answers: currentAnswers,
        currentQuestion,
      })
    );
  };

  // Function to load assignment state
  const loadAssignmentState = () => {
    const savedState = localStorage.getItem(
      `assignment_${params.assignment_id}`
    );
    if (savedState) {
      const {
        startTime,
        answers,
        currentQuestion: savedQuestion,
      } = JSON.parse(savedState);
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remainingTime = (assignment?.duration || 0) * 60 - elapsedSeconds;

      if (remainingTime > 0) {
        setRemainingDuration(remainingTime);
        setAnswers(answers);
        setCurrentQuestion(savedQuestion);
        return true;
      } else {
        // Clear expired state
        localStorage.removeItem(`assignment_${params.assignment_id}`);
      }
    }
    return false;
  };

  useEffect(() => {
    const checkEnrollment = async (courseId: string) => {
      try {
        console.log("Checking enrollment for courseId:", courseId);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/enroll`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to check enrollment");
        const data = await response.json();
        console.log("Full enrollment response:", data);
        if (data.status === "success") {
          console.log("Enrollment data structure:", {
            enrollments: data.data.map((enroll: any) => ({
              id: enroll.id,
              courseId: enroll.id,
              status: enroll.status,
            })),
          });
          // Check if user is enrolled in this course
          const isEnrolledInCourse = data.data.some((enroll: any) => {
            // The courseId is in the id field
            const enrollCourseId = enroll.id;
            console.log("Checking enrollment:", {
              enrollCourseId,
              currentCourseId: courseId,
              matches: enrollCourseId === courseId,
              enrollFull: enroll,
            });
            return enrollCourseId === courseId;
          });
          console.log("Is enrolled in course:", isEnrolledInCourse);
          setIsEnrolled(isEnrolledInCourse);
        } else {
          console.log("Enrollment check failed:", data);
          setIsEnrolled(false);
        }
      } catch (error) {
        console.error("Error checking enrollment:", error);
        setIsEnrolled(false);
      }
    };

    const fetchAssignmentAndAttempt = async () => {
      try {
        setLoading(true);
        // Check localStorage first
        const savedState = localStorage.getItem(
          `assignment_${params.assignment_id}`
        );
        if (savedState) {
          const {
            startTime,
            answers: savedAnswers,
            currentQuestion: savedQuestion,
          } = JSON.parse(savedState);
          const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
          const remainingTime =
            (assignment?.duration || 0) * 60 - elapsedSeconds;

          if (remainingTime > 0) {
            setAnswers(savedAnswers);
            setCurrentQuestion(savedQuestion);
            setRemainingDuration(remainingTime);
          }
        }

        // Fetch assignment
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/assignment/${params.assignment_id}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch assignment");
        }

        const data = await response.json();
        if (data.status === "success") {
          setAssignment(data.data);
          const courseId = data.data.courseId;
          await checkEnrollment(courseId);

          // Only initialize empty answers if there's no saved state
          if (!savedState) {
            setAnswers(
              data.data.questions.map((_: Question, index: number) => ({
                questionIndex: index,
                answer: "",
              }))
            );
            // Save initial state
            saveAssignmentState(Date.now(), []);
          }

          // Fetch attempt if it exists
          const attemptResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/attempt?assignmentId=${params.assignment_id}`,
            {
              credentials: "include",
            }
          );

          if (attemptResponse.ok) {
            const attemptData = await attemptResponse.json();
            if (
              attemptData.status === "success" &&
              attemptData.data.length > 0
            ) {
              const currentAttempt = attemptData.data.find(
                (a: Attempt) => a.assignmentId === params.assignment_id
              );
              if (currentAttempt) {
                setAttempt(currentAttempt);
                setAnswers(currentAttempt.answers);
                // Clear localStorage when attempt exists
                localStorage.removeItem(`assignment_${params.assignment_id}`);
              }
            }
          }
        } else {
          throw new Error(data.message || "Failed to fetch assignment");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (params.assignment_id) {
      fetchAssignmentAndAttempt();
    }
  }, [params.assignment_id]);

  useEffect(() => {
    if (assignment?.deadline) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const deadline = new Date(assignment.deadline).getTime();
        const timeRemaining = deadline - now;

        if (timeRemaining <= 0) {
          setTimeLeft("Time's up!");
          return;
        }

        const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      };

      updateCountdown();
      const timer = setInterval(updateCountdown, 1000);

      return () => clearInterval(timer);
    }
  }, [assignment?.deadline]);

  useEffect(() => {
    if (assignment?.duration && !attempt) {
      // Try to load saved state first
      const hasSavedState = loadAssignmentState();

      if (!hasSavedState) {
        // If no saved state, start fresh
        setRemainingDuration(assignment.duration * 60);
        // Save initial state
        saveAssignmentState(Date.now(), answers);
      }

      const timer = setInterval(() => {
        setRemainingDuration((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [assignment?.duration, attempt]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    if (attempt) return;
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = {
        questionIndex,
        answer,
      };
      // Save state after answer change
      const savedState = localStorage.getItem(
        `assignment_${params.assignment_id}`
      );
      if (savedState) {
        const { startTime } = JSON.parse(savedState);
        saveAssignmentState(startTime, newAnswers);
      }
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    if (attempt) return;
    try {
      setSubmitting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/assignment/${params.assignment_id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ answers }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit assignment");
      }

      const data = await response.json();
      if (data.status === "success") {
        // Clear saved state on successful submission
        localStorage.removeItem(`assignment_${params.assignment_id}`);
        router.push("/assignments");
      } else {
        throw new Error(data.message || "Failed to submit assignment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < (assignment?.questions.length || 0) - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleBackToCourse = () => {
    router.push(`/assignments/course/${assignment?.courseId}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading assignment...</p>
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
              <button
                className={styles.backButton}
                onClick={handleBackToCourse}
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>🔒</div>
              <p className={styles.errorMessage}>
                You need to enroll in this course to access assignments
              </p>
              <button
                className={styles.backButton}
                onClick={handleBackToCourse}
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className={styles.notFoundContainer}>
              <div className={styles.notFoundIcon}>🔍</div>
              <p>Assignment not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = assignment.questions[currentQuestion];

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <motion.div
            className={styles.assignmentContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.assignmentHeader}>
              <div className={styles.assignmentTitle}>
                <div
                  className={styles.titleRow}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h1>{assignment.name}</h1>
                  <div className={styles.duration}>
                    <h1>{formatDuration(remainingDuration)}</h1>
                  </div>
                </div>
              </div>
              <div className={styles.progressContainer}>
                <div
                  className={styles.progressBar}
                  style={{
                    width: `${
                      ((currentQuestion + 1) / assignment.questions.length) *
                      100
                    }%`,
                  }}
                ></div>
                <span className={styles.progressText}>
                  Question {currentQuestion + 1} of{" "}
                  {assignment.questions.length}
                </span>
              </div>
            </div>

            <div className={styles.assignmentContent}>
              <div className={styles.questionContainer}>
                <div className={styles.questionHeader}>
                  <h2 className={styles.questionTitle}>
                    <span className={styles.questionNumber}>
                      Q{currentQuestion + 1}
                    </span>
                    {question.title}
                  </h2>
                  <span
                    className={`${styles.questionType} ${
                      question.type === "multi_choice"
                        ? styles.multiChoice
                        : styles.assignment
                    }`}
                  >
                    {question.type === "multi_choice"
                      ? "Multiple Choice"
                      : "Written Answer"}
                  </span>
                </div>

                {question.type === "multi_choice" && question.options && (
                  <div className={styles.optionsContainer}>
                    {question.options.map((option, optionIndex) => (
                      <motion.div
                        key={optionIndex}
                        className={`${styles.optionItem} ${
                          answers[currentQuestion]?.answer === option
                            ? styles.selected
                            : ""
                        }`}
                        whileHover={!attempt ? { scale: 1.02 } : {}}
                        whileTap={!attempt ? { scale: 0.98 } : {}}
                        onClick={() =>
                          !attempt &&
                          handleAnswerChange(currentQuestion, option)
                        }
                      >
                        <div className={styles.optionLabel}>
                          <div className={styles.optionMarker}></div>
                          <span className={styles.optionText}>{option}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {question.type === "assignment" && (
                  <div className={styles.answerContainer}>
                    <textarea
                      className={styles.answerInput}
                      rows={6}
                      placeholder="Type your answer here..."
                      value={answers[currentQuestion]?.answer || ""}
                      onChange={(e) =>
                        !attempt &&
                        handleAnswerChange(currentQuestion, e.target.value)
                      }
                      readOnly={!!attempt}
                    />
                  </div>
                )}
              </div>

              <div className={styles.navigationButtons}>
                <button
                  className={`${styles.navButton} ${styles.prev}`}
                  onClick={handlePrevQuestion}
                  disabled={currentQuestion === 0}
                >
                  <i className="fas fa-arrow-left"></i>
                  Previous
                </button>
                {!attempt &&
                currentQuestion === assignment.questions.length - 1 ? (
                  <button
                    className={`${styles.navButton} ${styles.submit}`}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className={styles.spinner}></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check"></i>
                        Submit Assignment
                      </>
                    )}
                  </button>
                ) : currentQuestion === assignment.questions.length - 1 ? (
                  <button
                    className={`${styles.navButton} ${styles.backToCourse}`}
                    onClick={handleBackToCourse}
                  >
                    <i className="fas fa-arrow-left"></i>
                    Back to Course
                  </button>
                ) : (
                  <button
                    className={`${styles.navButton} ${styles.next}`}
                    onClick={handleNextQuestion}
                  >
                    Next
                    <i className="fas fa-arrow-right"></i>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage;
