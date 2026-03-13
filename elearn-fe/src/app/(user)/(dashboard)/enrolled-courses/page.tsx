"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface EnrolledCourse {
  id: string;
  name: string;
  shortDescription: string;
  thumbnail: string;
  progress: number;
  status: string;
  tag?: string;
  lessons?: number;
  duration?: string;
  enrolledStudents?: number;
}

const StudentEnrolledCoursesContent = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [activeTab, setActiveTab] = useState(0);
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
        if (data.status === "success" && Array.isArray(data.data)) {
          setEnrolledCourses(
            data.data.map((course: EnrolledCourse) => ({
              ...course,
              thumbnail:
                course.thumbnail ||
                "/assets/img/courses/course_thumb_default.jpg",
            }))
          );
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

  // Filter courses based on active tab
  const filteredCourses = enrolledCourses.filter((course) => {
    switch (activeTab) {
      case 1: // Active
        return (course.progress || 0) >= 0 && (course.progress || 0) < 100;
      case 2: // Completed
        return (course.progress || 0) === 100;
      default: // All
        return true;
    }
  });

  // Calculate counts for the tabs
  const allCount = enrolledCourses.length;
  const activeCount = enrolledCourses.filter(
    (course) => (course.progress || 0) >= 0 && (course.progress || 0) < 100
  ).length;
  const completedCount = enrolledCourses.filter(
    (course) => (course.progress || 0) === 100
  ).length;

  const enrolled_courses = [
    `All Courses (${allCount})`,
    `Active Courses (${activeCount})`,
    `Completed Courses (${completedCount})`,
  ];

  return (
    <div className="dashboard__content-wrap dashboard__content-wrap-two">
      <div className="dashboard__content-title">
        <h4 className="title">Enrolled Courses</h4>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="dashboard__nav-wrap mb-40">
            <ul className="nav nav-tabs" id="courseTab" role="tablist">
              {enrolled_courses.map((tab, index) => (
                <li
                  key={index}
                  onClick={() => setActiveTab(index)}
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
          </div>
          <div className="tab-content pb-4" id="courseTabContent">
            <div className="tab-pane fade show active">
              {loading ? (
                <div className="text-center">
                  <p>Loading courses...</p>
                </div>
              ) : error ? (
                <div className="text-center">
                  <p className="text-danger">{error}</p>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center">
                  <p>
                    No{" "}
                    {activeTab === 0
                      ? "enrolled"
                      : activeTab === 1
                      ? "active"
                      : "completed"}{" "}
                    courses found.
                  </p>
                  {activeTab === 0 && (
                    <Link href="/courses" className="btn">
                      Browse Courses
                    </Link>
                  )}
                </div>
              ) : (
                <div className="row">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="col-xl-4 col-md-6">
                      <div className="courses__item courses__item-two shine__animate-item">
                        <div className="courses__item-thumb courses__item-thumb-two">
                          <Link
                            href={`/learning/${course.id}`}
                            className="shine__animate-link"
                          >
                            <Image
                              src={course.thumbnail}
                              alt={course.name}
                              width={400}
                              height={250}
                              style={{
                                objectFit: "cover",
                                width: "100%",
                                height: "100%",
                              }}
                            />
                          </Link>
                        </div>
                        <div className="courses__item-content courses__item-content-two">
                          {course.tag && (
                            <ul className="courses__item-meta list-wrap">
                              <li className="courses__item-tag">
                                <Link href="#">{course.tag}</Link>
                              </li>
                            </ul>
                          )}
                          <h5 className="title">
                            <Link href={`/learning/${course.id}`}>
                              {course.name}
                            </Link>
                          </h5>
                          <div className="progress-item progress-item-two">
                            <h6 className="title">
                              COMPLETE&nbsp;&nbsp;
                              <span>{course.progress}%</span>
                            </h6>
                            <div className="progress">
                              <div
                                className="progress-bar"
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="courses__item-bottom-two">
                          <ul className="list-wrap">
                            <li>
                              <i className="flaticon-book"></i>
                              {course.lessons || 0}
                            </li>
                            <li>
                              <i className="flaticon-clock"></i>
                              {course.duration || "0h 0m"}
                            </li>
                            <li>
                              <i className="flaticon-user-1"></i>
                              {course.enrolledStudents || 0}
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEnrolledCoursesContent;
