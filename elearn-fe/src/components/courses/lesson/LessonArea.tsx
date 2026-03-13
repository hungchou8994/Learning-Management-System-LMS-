"use client";
import Link from "next/link";
import LessonFaq from "./LessonFaq";
import LessonNavTav from "./LessonNavTav";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const LessonVideo = dynamic(() => import("./LessonVideo"), { ssr: false });

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
  lessons: Lesson[];
  order_index: number;
}

interface CourseData {
  _id: string;
  name: string;
  description: string;
  shortDescription: string;
  targets: string[];
  requirements: string[];
  sessions: Session[];
  instructorId: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
    bio: string;
    skill: string;
  };
  feedback: any[];
}

interface LessonAreaProps {
  courseData: CourseData;
  isEnrolled?: boolean;
}

const LessonArea = ({ courseData, isEnrolled = false }: LessonAreaProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [videoKey, setVideoKey] = useState(0);

  // Get all lessons in order
  const getAllLessons = () => {
    const allLessons: Lesson[] = [];
    courseData.sessions
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
      .forEach((session) => {
        const sortedLessons = [...session.lessons].sort(
          (a, b) => (a.order_index || 0) - (b.order_index || 0)
        );
        allLessons.push(...sortedLessons);
      });
    return allLessons;
  };

  // Find lesson by ID
  const findLessonById = (lessonId: string) => {
    for (const session of courseData.sessions) {
      const lesson = session.lessons.find((l) => l._id === lessonId);
      if (lesson) {
        return lesson;
      }
    }
    return null;
  };

  // Get default lesson (first lesson)
  const getDefaultLesson = () => {
    const allLessons = getAllLessons();
    return allLessons[0] || null;
  };

  // Get next and previous lessons
  const getAdjacentLessons = (currentLessonId: string) => {
    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex((l) => l._id === currentLessonId);

    return {
      prev: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
      next:
        currentIndex < allLessons.length - 1
          ? allLessons[currentIndex + 1]
          : null,
    };
  };

  // Handle navigation between lessons
  const handleNavigation = (direction: "prev" | "next") => {
    if (!currentLesson) return;

    const { prev, next } = getAdjacentLessons(currentLesson._id);
    const targetLesson = direction === "prev" ? prev : next;

    if (targetLesson) {
      if (!isEnrolled && targetLesson.locked) {
        // Redirect to course page if trying to access locked lesson
        router.push(`/courses/${courseData._id}`);
        return;
      }
      window.history.pushState(
        {},
        "",
        `/learning/${courseData._id}?lessonId=${targetLesson._id}`
      );
      setCurrentLesson(targetLesson);
      setVideoKey((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const lessonId = searchParams.get("lessonId");
    if (lessonId) {
      const lesson = findLessonById(lessonId);
      if (lesson) {
        if (!isEnrolled && lesson.locked) {
          // Redirect to course page if trying to access locked lesson
          router.push(`/courses/${courseData._id}`);
          return;
        }
        setCurrentLesson(lesson);
        setVideoKey((prev) => prev + 1);
        return;
      }
    }
    // If no lesson ID in URL or lesson not found, find first free lesson
    const allLessons = getAllLessons();
    const firstFreeLessonOrDefault =
      allLessons.find((lesson) => !lesson.locked) || allLessons[0];
    setCurrentLesson(firstFreeLessonOrDefault);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isEnrolled]);

  const { prev, next } = currentLesson
    ? getAdjacentLessons(currentLesson._id)
    : { prev: null, next: null };

  return (
    <section className="lesson__area section-pb-120">
      <div className="container-fluid p-0">
        <div className="row gx-0">
          <div className="col-xl-3 col-lg-4">
            <div className="lesson__content">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginLeft: "20px",
                  marginRight: "20px",
                  alignItems: "center",
                  borderBottom: "1px solid #e0e0e0",
                }}
              >
                <h2 className="title" style={{ fontSize: "20px" }}>
                  Course Content
                </h2>
                <div className="lesson__video-wrap-top-right">
                  <i className="fas fa-times"></i>
                </div>
              </div>
              <LessonFaq
                sessions={courseData.sessions}
                courseId={courseData._id}
              />
            </div>
          </div>
          <div className="col-xl-9 col-lg-8">
            <div className="lesson__video-wrap">
              <div className="lesson__video-wrap-top">
                <div className="lesson__video-wrap-top-left">
                  <Link href={`/courses/${courseData._id}`}>
                    <i className="flaticon-arrow-right"></i>
                  </Link>
                  <span>{currentLesson?.title || courseData.name}</span>
                </div>
                <div className="lesson__video-wrap-top-right">
                  <Link href={`/courses/${courseData._id}`}>
                    <i className="fas fa-times"></i>
                  </Link>
                </div>
              </div>
              {/* Meeting URL for online lessons */}
              {currentLesson?.type === "online" && currentLesson?.video_url && (
                <div
                  style={{
                    padding: "20px",
                    margin: "20px",
                    backgroundColor: "#f0f7ff",
                    border: "2px solid #0066cc",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <h4 style={{ marginBottom: "10px", color: "#0066cc" }}>
                    <i className="fas fa-video me-2"></i>
                    Online Meeting
                  </h4>
                  <p style={{ marginBottom: "15px", color: "#333" }}>
                    Click the button below to join the online class:
                  </p>
                  <a
                    href={currentLesson.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      padding: "12px 24px",
                      backgroundColor: "#0066cc",
                      color: "white",
                      textDecoration: "none",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      transition: "background-color 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#0052a3";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#0066cc";
                    }}
                  >
                    <i className="fas fa-external-link-alt me-2"></i>
                    Join Online Class
                  </a>
                </div>
              )}
              <div
                style={{
                  display: currentLesson?.type === "video" ? "block" : "none",
                }}
              >
                <div key={videoKey}>
                  <LessonVideo
                    courseData={courseData}
                    currentLesson={currentLesson}
                  />
                </div>
              </div>
              {/* {currentLesson?.type === "video" ? (
                <div key={videoKey}>
                  <LessonVideo
                    courseData={courseData}
                    currentLesson={currentLesson}
                  />
                </div>
              ) : currentLesson ? (
                <div
                  className="lesson__video-player"
                  style={{
                    height: "680px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="no-video-message">
                    {currentLesson.type === "document" ? (
                      <div>
                        <i className="fas fa-file-alt fa-3x mb-3"></i>
                        <p>This is a document-based lesson</p>
                      </div>
                    ) : (
                      <div>
                        <i className="fas fa-globe fa-3x mb-3"></i>
                        <p>This is an online resource lesson</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null} */}
              <div className="lesson__next-prev-button">
                <button
                  className="prev-button"
                  title="Previous Lesson"
                  onClick={() => handleNavigation("prev")}
                  disabled={!prev}
                  style={{ opacity: prev ? 1 : 0.5 }}
                >
                  <i className="flaticon-arrow-right"></i>
                </button>
                <button
                  className="next-button"
                  title="Next Lesson"
                  onClick={() => handleNavigation("next")}
                  disabled={!next}
                  style={{ opacity: next ? 1 : 0.5 }}
                >
                  <i className="flaticon-arrow-right"></i>
                </button>
              </div>
            </div>
            <LessonNavTav
              courseData={courseData}
              currentLesson={currentLesson}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default LessonArea;
