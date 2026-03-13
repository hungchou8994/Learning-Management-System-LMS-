"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import Overview from "./Overview";
import Sidebar from "./Sidebar";
import Curriculum from "./Curriculum";
import Reviews from "./Reviews";
import Instructors from "./Instructors";

const tab_title: string[] = [
  "Overview",
  "Curriculum",
  "Instructors",
  "Reviews",
];

interface CourseDetailsProps {
  course: {
    _id: string;
    name: string;
    description: string;
    shortDescription: string;
    originalPrice: number;
    salePrice?: number;
    thumbnail: string;
    targets: string[];
    requirements: string[];
    sessions: any[];
    certificate: boolean;
    level: number;
    instructorId: {
      _id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatarUrl: string;
      bio: string;
      skill: string;
    };
    tag: string;
    enrollments: any[];
    rating: number;
    feedback: any[];
    totalStudents: number;
  };
}

const CourseDetailsArea = ({ course }: CourseDetailsProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  // Calculate actual rating from feedback
  const actualRating =
    course.feedback?.length > 0
      ? (
          course.feedback.reduce((acc, item) => acc + item.rate, 0) /
          course.feedback.length
        ).toFixed(1)
      : "0.0";

  // Get actual student count from enrollments
  const actualStudentCount =
    course.enrollments?.filter((enrollment) => enrollment.status === "paid")
      .length || 0;

  return (
    <section className="courses__details-area section-py-120">
      <div className="container">
        <div className="row">
          <div className="col-xl-9 col-lg-8">
            <div className="courses__details-thumb">
              <Image
                src={
                  course.thumbnail || "/assets/img/courses/courses_details.jpg"
                }
                alt={course.name || "Course Image"}
                width={800}
                height={450}
                style={{ width: "100%", objectFit: "cover", height: "400px" }}
              />
            </div>
            <div className="courses__details-content">
              <ul className="courses__item-meta list-wrap">
                <li className="courses__item-tag">
                  <Link href="/course">{course.tag}</Link>
                </li>
                <li className="avg-rating">
                  <i className="fas fa-star"></i> {actualRating}
                </li>
              </ul>
              <h2 className="title">{course.name}</h2>
              <div className="courses__details-meta">
                <ul className="list-wrap">
                  <li className="author-two">
                    <Image
                      src={
                        course.instructorId.avatarUrl ||
                        "/assets/img/courses/course_author001.png"
                      }
                      alt={`${course.instructorId.firstName} ${course.instructorId.lastName}`}
                      width={50}
                      height={50}
                    />
                    By{" "}
                    <Link href={`/instructors/${course.instructorId._id}`}>
                      {course.instructorId.firstName}{" "}
                      {course.instructorId.lastName}
                    </Link>
                  </li>
                  <li>
                    <i className="flaticon-mortarboard"></i>
                    {/* {actualStudentCount} Students */}
                    {course.totalStudents} Students
                  </li>
                </ul>
              </div>
              <ul className="nav nav-tabs" id="myTab" role="tablist">
                {tab_title.map((tab, index) => (
                  <li
                    key={index}
                    onClick={() => handleTabClick(index)}
                    className="nav-item"
                    role="presentation"
                  >
                    <button
                      className={`nav-link ${
                        activeTab === index ? "active" : ""
                      }`}
                    >
                      {tab}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="tab-content" id="myTabContent">
                <div
                  className={`tab-pane fade ${
                    activeTab === 0 ? "show active" : ""
                  }`}
                  id="overview-tab-pane"
                  role="tabpanel"
                  aria-labelledby="overview-tab"
                >
                  <Overview
                    description={course.description}
                    targets={course.targets}
                    requirements={course.requirements}
                  />
                </div>
                <div
                  className={`tab-pane fade ${
                    activeTab === 1 ? "show active" : ""
                  }`}
                  id="curriculum-tab-pane"
                  role="tabpanel"
                  aria-labelledby="curriculum-tab"
                >
                  <Curriculum sessions={course.sessions} />
                </div>
                <div
                  className={`tab-pane fade ${
                    activeTab === 2 ? "show active" : ""
                  }`}
                  id="instructors-tab-pane"
                  role="tabpanel"
                  aria-labelledby="instructors-tab"
                >
                  <Instructors instructor={course.instructorId} />
                </div>
                <div
                  className={`tab-pane fade ${
                    activeTab === 3 ? "show active" : ""
                  }`}
                  id="reviews-tab-pane"
                  role="tabpanel"
                  aria-labelledby="reviews-tab"
                >
                  <Reviews feedback={course.feedback} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-lg-4">
            <Sidebar course={course} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseDetailsArea;
