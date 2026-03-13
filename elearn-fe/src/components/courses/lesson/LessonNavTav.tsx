"use client";
import { useState } from "react";
import Overview from "../lesson-details/Overview";
import Reviews from "../lesson-details/Reviews";
import Instructors from "../lesson-details/Instructors";

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

interface LessonNavTavProps {
  courseData: CourseData;
  currentLesson: Lesson | null;
}

const tab_title: string[] = ["Overview", "Instructors"];

const LessonNavTav = ({ courseData, currentLesson }: LessonNavTavProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  if (!currentLesson) {
    return <div>No lesson selected</div>;
  }

  return (
    <div
      className="courses__details-content lesson__details-content"
      style={{ marginLeft: "20px", marginRight: "20px" }}
    >
      <ul className="nav nav-tabs" id="myTab" role="tablist">
        {tab_title.map((tab, index) => (
          <li
            key={index}
            onClick={() => handleTabClick(index)}
            className="nav-item"
            role="presentation"
          >
            <button
              className={`nav-link ${activeTab === index ? "active" : ""}`}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>
      <div className="tab-content" id="myTabContent">
        <div
          className={`tab-pane fade ${activeTab === 0 ? "show active" : ""}`}
          id="overview-tab-pane"
          role="tabpanel"
          aria-labelledby="overview-tab"
        >
          <Overview
            description={currentLesson.description}
            lessonInfo={{
              title: currentLesson.title,
              duration: currentLesson.duration,
              type: currentLesson.type,
            }}
          />
        </div>
        <div
          className={`tab-pane fade ${activeTab === 1 ? "show active" : ""}`}
          id="instructors-tab-pane"
          role="tabpanel"
          aria-labelledby="instructors-tab"
        >
          <Instructors instructor={courseData.instructorId} />
        </div>
        <div
          className={`tab-pane fade ${activeTab === 2 ? "show active" : ""}`}
          id="reviews-tab-pane"
          role="tabpanel"
          aria-labelledby="reviews-tab"
        >
          {/* <Reviews feedback={courseData.feedback} /> */}
        </div>
      </div>
    </div>
  );
};

export default LessonNavTav;
