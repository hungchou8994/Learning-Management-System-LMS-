import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import icon_1 from "@/assets/img/icons/lock.svg";

interface Lesson {
  _id: string;
  title: string;
  type: "video" | "document" | "online";
  duration: number;
  order_index: number;
  video_url: string | null;
  subtitle: string | null;
  description: string;
  sessionId: string;
  locked: boolean;
}

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
}

interface Session {
  _id: string;
  name: string;
  description: string;
  lessons: Lesson[];
  order_index: number;
}

interface LessonFaqProps {
  sessions: Session[];
  courseId: string;
}

const LessonFaq = ({ sessions, courseId }: LessonFaqProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLessonId = searchParams.get("lessonId");
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/assignment/course/${courseId}`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch assignments");
        const data = await response.json();
        if (data.status === "success") {
          setAssignments(data.data);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      }
    };

    if (courseId) {
      fetchAssignments();
    }
  }, [courseId]);

  const handleLessonClick = (lesson: Lesson) => {
    const url = new URL(window.location.href);
    url.searchParams.set("lessonId", lesson._id);
    window.history.pushState({}, "", url.toString());
    router.replace(url.toString());
  };

  const handleAssignmentClick = (assignment: Assignment) => {
    window.open(`/assignments/${assignment.id}`, "_blank");
  };

  // Sort sessions by order_index
  const sortedSessions = [...sessions].sort(
    (a, b) => (a.order_index || 0) - (b.order_index || 0)
  );

  return (
    <div className="accordion" id="accordionExample">
      {sortedSessions.map((session, index) => {
        // Sort lessons by order_index
        const sortedLessons = [...session.lessons].sort(
          (a, b) => (a.order_index || 0) - (b.order_index || 0)
        );

        // Get assignment for this session
        const sessionAssignment = assignments.find(
          (a) => a.sessionId === session._id
        );

        // Calculate free lessons
        const freeLessons = sortedLessons.filter((l) => !l.locked).length;

        return (
          <div key={session._id} className="accordion-item">
            <h2 className="accordion-header">
              <button
                className={`accordion-button ${index === 0 ? "" : "collapsed"}`}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#collapseOne${session._id}`}
                aria-expanded={index === 0 ? "true" : "false"}
                aria-controls={`collapseOne${session._id}`}
              >
                {session.name}
                <span className="badge">
                  {sortedLessons.length} lessons ({freeLessons} free)
                </span>
              </button>
            </h2>
            <div
              id={`collapseOne${session._id}`}
              className={`accordion-collapse collapse ${
                index === 0 ? "show" : ""
              }`}
              data-bs-parent="#accordionExample"
            >
              <div className="accordion-body">
                <ul>
                  {sortedLessons.map((lesson) => (
                    <li
                      key={lesson._id}
                      className={`course-item ${
                        currentLessonId === lesson._id ? "active" : ""
                      }`}
                      onClick={() => handleLessonClick(lesson)}
                      style={{
                        cursor: lesson.locked ? "not-allowed" : "pointer",
                      }}
                    >
                      <div className="course-item-link">
                        <span
                          className="item-name"
                          style={{
                            cursor: lesson.locked ? "not-allowed" : "pointer",
                          }}
                        >
                          {lesson.title.length > 32
                            ? lesson.title.slice(0, 32) + "..."
                            : lesson.title}
                        </span>
                        <div className="course-item-meta">
                          <span className="item-meta duration">
                            {lesson.locked ? (
                              <i
                                className="fas fa-lock me-2"
                                style={{ color: "#dc3510" }}
                              ></i>
                            ) : (
                              <i
                                className="fas fa-unlock me-2"
                                style={{ color: "#28a745" }}
                              ></i>
                            )}
                            {lesson.type === "video" && (
                              <i className="fas fa-play-circle me-1"></i>
                            )}
                            {lesson.type === "document" && (
                              <i className="fas fa-file-alt me-1"></i>
                            )}
                            {lesson.type === "online" && (
                              <i className="fas fa-globe me-1"></i>
                            )}
                            {lesson.duration} min
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                  {sessionAssignment && (
                    <li
                      className={`course-item ${
                        searchParams.get("assignmentId") ===
                        sessionAssignment.id
                          ? "active"
                          : ""
                      }`}
                      onClick={() => handleAssignmentClick(sessionAssignment)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="course-item-link">
                        <span className="item-name">
                          {sessionAssignment.name.length > 27
                            ? sessionAssignment.name.slice(0, 27) + "..."
                            : sessionAssignment.name}
                        </span>
                        <div className="course-item-meta">
                          <span className="item-meta duration">
                            <i className="fas fa-tasks me-2"></i>
                            {sessionAssignment.status === "graded" ? (
                              <span style={{ color: "#28a745" }}>
                                {sessionAssignment.grade}%
                              </span>
                            ) : sessionAssignment.status === "completed" ? (
                              <span style={{ color: "#ffc107" }}>
                                Submitted
                              </span>
                            ) : (
                              <span style={{ color: "#dc3510" }}>Pending</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LessonFaq;
