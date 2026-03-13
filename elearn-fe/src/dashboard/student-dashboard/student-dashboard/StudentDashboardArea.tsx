import Count from "@/components/common/Count";
import DashboardBannerTwo from "@/dashboard/dashboard-common/DashboardBannerTwo";
import DashboardSidebarTwo from "@/dashboard/dashboard-common/DashboardSidebarTwo";
import dashboard_count_data from "@/data/dashboard-data/DashboardCounterData";
import Image from "next/image";
import bg_img from "@/assets/img/bg/dashboard_bg.jpg";
import { useEffect, useState } from "react";
import Link from "next/link";

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

const StudentDashboardArea = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch enrolled courses
        const coursesResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/enroll`,
          {
            credentials: "include",
          }
        );

        if (!coursesResponse.ok) {
          throw new Error("Failed to fetch enrolled courses");
        }

        const coursesData = await coursesResponse.json();
        if (
          coursesData.status === "success" &&
          Array.isArray(coursesData.data)
        ) {
          setEnrolledCourses(
            coursesData.data.map((course: EnrolledCourse) => ({
              ...course,
              thumbnail:
                course.thumbnail ||
                "/assets/img/courses/course_thumb_default.jpg",
            }))
          );
        } else {
          throw new Error(
            coursesData.message || "Failed to fetch enrolled courses"
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats from enrolled courses
  const totalEnrolled = enrolledCourses.length;
  const activeCourses = enrolledCourses.filter(
    (course) => (course.progress || 0) >= 0 && (course.progress || 0) < 100
  ).length;
  const completedCourses = enrolledCourses.filter(
    (course) => (course.progress || 0) === 100
  ).length;

  // Update the counts in dashboard_count_data
  const updatedDashboardData = dashboard_count_data.map((item) => {
    switch (item.id) {
      case 1: // Enrolled Courses
        return { ...item, count: totalEnrolled };
      case 2: // Active Courses
        return { ...item, count: activeCourses };
      case 3: // Completed Courses
        return { ...item, count: completedCourses };
      default:
        return item;
    }
  });

  return (
    <div className="dashboard__count-wrap">
      <div className="dashboard__content-title">
        <h4 className="title">Dashboard</h4>
        <div className="row">
          {updatedDashboardData.slice(0, 3).map((item) => (
            <div key={item.id} className="col-lg-4 col-md-4 col-sm-6">
              <div className="dashboard__counter-item">
                <div className="icon">
                  <i className={item.icon}></i>
                </div>
                <div className="content">
                  <span className="count">
                    <Count number={item.count} />
                  </span>
                  <p style={{ marginTop: "14px" }}>{item.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="progress__courses-wrap">
        <div className="dashboard__content-title">
          <h4 className="title">In Progress Courses</h4>
        </div>
        <div className="row">
          {loading ? (
            <div className="col-12 text-center">
              <p>Loading courses...</p>
            </div>
          ) : error ? (
            <div className="col-12 text-center">
              <p className="text-danger">{error}</p>
            </div>
          ) : enrolledCourses.filter(
              (course) =>
                (course.progress || 0) >= 0 && (course.progress || 0) < 100
            ).length === 0 ? (
            <div className="col-12 text-center">
              <p>No courses in progress.</p>
              <Link href="/courses" className="btn">
                Browse Courses
              </Link>
            </div>
          ) : (
            enrolledCourses
              .filter(
                (course) =>
                  (course.progress || 0) >= 0 && (course.progress || 0) < 100
              )
              .map((course) => (
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
              ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardArea;
