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
  createdAt: string;
  courseId: {
    price: number;
  };
}

const StudentHistoryContent = () => {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
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
          // Filter only successful enrollments
          const successfulEnrollments = data.data.filter(
            (course: EnrolledCourse) => course.status === "paid"
          );
          setEnrolledCourses(
            successfulEnrollments.map((course: EnrolledCourse) => ({
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null) return "$0.00";
    return `$${Number(price).toFixed(2)}`;
  };

  return (
    <div className="col-lg-9">
      <div className="dashboard__content-wrap">
        <div className="dashboard__content-title">
          <h4 className="title">Order History</h4>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="dashboard__review-table">
              <table className="table table-borderless">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Course Name</th>
                    <th>Enrollment Date</th>
                    <th>Course Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center">
                        Loading...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={5} className="text-center text-danger">
                        {error}
                      </td>
                    </tr>
                  ) : enrolledCourses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center">
                        No enrolled courses found.
                        <br />
                        <Link href="/courses" className="btn mt-3">
                          Browse Courses
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    enrolledCourses.map((course) => (
                      <tr key={course.id}>
                        <td>
                          <p>#{course.id.slice(-4)}</p>
                        </td>
                        <td>
                          <p>{course.name}</p>
                        </td>
                        <td>
                          <p>{formatDate(course.createdAt)}</p>
                        </td>
                        <td>
                          <p>{formatPrice(course.courseId?.price)}</p>
                        </td>
                        <td>
                          <span className="dashboard__quiz-result success">
                            Success
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHistoryContent;
