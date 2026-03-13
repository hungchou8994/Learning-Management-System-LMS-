import React, { useState } from "react";
import VideoPopup from "@/modals/VideoPopup";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

interface Session {
  _id: string;
  name: string;
  description?: string;
  orderIndex: number;
  courseId: string;
  lessons: Lesson[];
}

interface CurriculumProps {
  sessions: Session[];
}

const Curriculum = ({ sessions }: CurriculumProps) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const router = useRouter();

  const handleVideoOpen = (videoId: string) => {
    setActiveVideoId(videoId);
    setIsVideoOpen(true);
  };

  const handleLessonClick = (lesson: Lesson, session: Session) => {
    if (!lesson.locked) {
      router.push(`/learning/${session.courseId}?lessonId=${lesson._id}`);
    }
  };

  // Sort sessions by orderIndex
  const sortedSessions = [...sessions].sort(
    (a, b) => a.orderIndex - b.orderIndex
  );

  return (
    <>
      <div className="courses__curriculum-wrap">
        <h3 className="title">Course Curriculum</h3>
        <p>
          Master the course content through our structured curriculum. Each
          session builds upon the previous one, providing you with a
          comprehensive learning experience.
        </p>
        <div className="accordion" id="courseAccordion">
          {sortedSessions.map((session, index) => {
            // Sort lessons by order_index
            const sortedLessons = [...session.lessons].sort(
              (a, b) => a.order_index - b.order_index
            );

            // Calculate unlocked lessons
            const unlockedLessons = sortedLessons.filter(
              (l) => !l.locked
            ).length;

            return (
              <div key={session._id} className="accordion-item">
                <h2 className="accordion-header">
                  <button
                    className={`accordion-button ${
                      index === 0 ? "" : "collapsed"
                    }`}
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#collapse${index}`}
                    aria-expanded={index === 0 ? "true" : "false"}
                    aria-controls={`collapse${index}`}
                  >
                    {session.name}
                    <span className="badge">
                      {sortedLessons.length} lessons ({unlockedLessons}{" "}
                      unlocked)
                    </span>
                  </button>
                </h2>
                <div
                  id={`collapse${index}`}
                  className={`accordion-collapse collapse ${
                    index === 0 ? "show" : ""
                  }`}
                  data-bs-parent="#courseAccordion"
                >
                  <div className="accordion-body">
                    {session.description && (
                      <p className="session-description mb-3">
                        {session.description}
                      </p>
                    )}
                    <ul className="list-wrap">
                      {sortedLessons.map((lesson) => (
                        <li
                          key={lesson._id}
                          className={`course-item ${
                            !lesson.locked ? "open-item" : ""
                          }`}
                        >
                          <div
                            className="course-item-link"
                            onClick={() => handleLessonClick(lesson, session)}
                            style={{
                              cursor: !lesson.locked ? "pointer" : "default",
                            }}
                          >
                            <span className="item-name">{lesson.title}</span>
                            <div className="course-item-meta">
                              {lesson.type === "video" && lesson.video_url && (
                                <span
                                  className="duration"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!lesson.locked) {
                                      handleVideoOpen(lesson.video_url!);
                                    }
                                  }}
                                  style={{
                                    cursor: lesson.locked
                                      ? "default"
                                      : "pointer",
                                  }}
                                >
                                  {lesson.locked ? (
                                    <i className="fas fa-lock me-2"></i>
                                  ) : (
                                    <span className="badge bg-success me-2">
                                      Unlocked
                                    </span>
                                  )}
                                  <i className="fas fa-play-circle"></i>{" "}
                                  {lesson.duration} min
                                </span>
                              )}
                              {lesson.type === "document" && (
                                <span className="duration">
                                  {lesson.locked ? (
                                    <i className="fas fa-lock me-2"></i>
                                  ) : (
                                    <span className="badge bg-success me-2">
                                      Unlocked
                                    </span>
                                  )}
                                  <i className="fas fa-file-alt"></i>{" "}
                                  {lesson.duration} min
                                </span>
                              )}
                              {lesson.type === "online" && (
                                <span className="duration">
                                  {lesson.locked ? (
                                    <i className="fas fa-lock me-2"></i>
                                  ) : (
                                    <span className="badge bg-success me-2">
                                      Unlocked
                                    </span>
                                  )}
                                  <i className="fas fa-globe"></i>{" "}
                                  {lesson.duration} min
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {isVideoOpen && activeVideoId && (
        <VideoPopup
          isVideoOpen={isVideoOpen}
          setIsVideoOpen={setIsVideoOpen}
          videoId={activeVideoId}
        />
      )}
    </>
  );
};

export default Curriculum;
