import React, { useState } from "react";
import VideoPopup from "@/modals/VideoPopup";

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
  description: string;
  orderIndex: number;
  lessons: Lesson[];
  courseId: string;
  assignment?: string;
}

interface CurriculumProps {
  sessions: Session[];
}

const Curriculum = ({ sessions }: CurriculumProps) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const handleVideoOpen = (videoId: string) => {
    setActiveVideoId(videoId);
    setIsVideoOpen(true);
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

            // Calculate free lessons
            const freeLessons = sortedLessons.filter((l) => !l.locked).length;

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
                      {sortedLessons.length} lessons ({freeLessons} free)
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
                        <li key={lesson._id} className="course-item">
                          <div className="course-item-link">
                            <span className="item-name">
                              {lesson.title}
                              {/* {lesson.subtitle && (
                                <small className="text-muted d-block">
                                  {lesson.subtitle}
                                </small>
                              )} */}
                            </span>
                            <div className="course-item-meta">
                              {lesson.type === "video" && lesson.video_url && (
                                <span
                                  className="duration"
                                  onClick={() =>
                                    !lesson.locked &&
                                    handleVideoOpen(lesson.video_url!)
                                  }
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
                                      Free
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
                                      Free
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
                                      Free
                                    </span>
                                  )}
                                  <i className="fas fa-globe"></i>{" "}
                                  {lesson.duration} min
                                </span>
                              )}
                            </div>
                          </div>
                          {/* {lesson.description && (
                            <p className="lesson-description text-muted small mt-1">
                              {lesson.description}
                            </p>
                          )} */}
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
