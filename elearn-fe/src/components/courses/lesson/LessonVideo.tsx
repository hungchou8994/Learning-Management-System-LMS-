"use client";
import { useEffect, useState } from "react";
import Plyr from "plyr";

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
  sessions: Session[];
  instructorId: {
    _id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string;
  };
}

interface LessonVideoProps {
  courseData: CourseData;
  currentLesson: Lesson | null;
}

const LessonVideo = ({ courseData, currentLesson }: LessonVideoProps) => {
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);

  useEffect(() => {
    if (currentLesson?.type === "video" && currentLesson.video_url) {
      setCurrentVideo(currentLesson.video_url);
    } else {
      // Find the first unlocked video in the course as fallback
      for (const session of courseData.sessions) {
        for (const lesson of session.lessons) {
          if (!lesson.locked && lesson.type === "video" && lesson.video_url) {
            setCurrentVideo(lesson.video_url);
            return;
          }
        }
      }
    }
  }, [courseData, currentLesson]);

  useEffect(() => {
    const player = new Plyr("#player");
    return () => {
      player.destroy();
    };
  }, [currentVideo]);

  if (!currentVideo) {
    return (
      <div className="lesson__video-player">
        <div className="no-video-message">No available video to play</div>
      </div>
    );
  }

  return (
    <video
      id="player"
      playsInline
      controls
      data-poster="/assets/img/bg/video_bg.webp"
      // style={{ height: "680px" }}
    >
      <source src={currentVideo} type="video/mp4" />
      <source src={currentVideo} type="video/webm" />
    </video>
  );
};

export default LessonVideo;
