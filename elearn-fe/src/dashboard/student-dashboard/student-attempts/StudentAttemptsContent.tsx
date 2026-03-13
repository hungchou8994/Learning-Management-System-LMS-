"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Attempt {
  id: string;
  username: string;
  assignmentId: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  instructorId?: string;
  answers: Array<{
    questionId: string;
    answer: string | string[];
  }>;
  createdAt: string;
  updatedAt: string;
  assignment?: {
    name: string;
    course: {
      name: string;
    };
    duration: number;
    deadline: string;
  };
}

const StudentAttemptsContent = () => {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        console.log("Fetching attempts...");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/attempt`,
          {
            credentials: "include",
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch attempts");
        }
        const data = await response.json();
        console.log("Attempts API Response:", data);

        if (data.status === "success") {
          // Fetch assignment details for each attempt
          const attemptsWithDetails = await Promise.all(
            data.data.map(async (attempt: Attempt) => {
              try {
                const assignmentResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/assignment/${attempt.assignmentId}`,
                  {
                    credentials: "include",
                  }
                );
                if (assignmentResponse.ok) {
                  const assignmentData = await assignmentResponse.json();
                  if (assignmentData.status === "success") {
                    // Fetch course information
                    const courseResponse = await fetch(
                      `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/course/${assignmentData.data.courseId}`,
                      {
                        credentials: "include",
                      }
                    );
                    let courseName = "Unknown Course";
                    if (courseResponse.ok) {
                      const courseData = await courseResponse.json();
                      if (courseData.status === "success") {
                        courseName = courseData.data.name;
                      }
                    }

                    return {
                      ...attempt,
                      assignment: {
                        name: assignmentData.data.name,
                        course: {
                          name: courseName,
                        },
                        duration: assignmentData.data.duration,
                        deadline: assignmentData.data.deadline,
                      },
                    };
                  }
                }
                return attempt;
              } catch (error) {
                console.error("Error fetching assignment details:", error);
                return attempt;
              }
            })
          );

          console.log("Attempts with details:", attemptsWithDetails);
          setAttempts(attemptsWithDetails);
        } else {
          console.error("API returned error status:", data);
        }
      } catch (error) {
        console.error("Error fetching attempts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, []);

  if (loading) {
    return (
      <div className="dashboard__content-wrap">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="dashboard__content-wrap">
        <div className="dashboard__content-title">
          <h4 className="title">My Assignment Attempts</h4>
        </div>
        <div className="row">
          <div className="col-12">
            <div className="dashboard__review-table">
              <p className="text-center">
                No attempts found. Start by taking an assignment!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard__content-wrap">
      <div className="dashboard__content-title">
        <h4 className="title">My Assignment Attempts</h4>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="dashboard__review-table">
            <table className="table table-borderless">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Course</th>
                  <th>Duration</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Grade</th>
                  <th>Feedback</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>
                      <div className="dashboard__quiz-info">
                        <h6 className="title">
                          <Link href={`/assignments/${attempt.assignmentId}`}>
                            {attempt.assignment?.name || "Unknown Assignment"}
                          </Link>
                        </h6>
                      </div>
                    </td>
                    <td>
                      <p className="color-black">
                        {attempt.assignment?.course?.name || "Unknown Course"}
                      </p>
                    </td>
                    <td>
                      <p className="color-black">
                        {attempt.assignment?.duration
                          ? `${attempt.assignment.duration} min`
                          : "N/A"}
                      </p>
                    </td>
                    <td>
                      <p className="color-black">
                        {attempt.assignment?.deadline
                          ? new Date(
                              attempt.assignment.deadline
                            ).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </td>
                    <td>
                      <span
                        className={`dashboard__quiz-result ${
                          attempt.grade ? "passed" : "pending"
                        }`}
                      >
                        {attempt.grade ? "Graded" : "Completed"}
                      </span>
                    </td>
                    <td>
                      <p className="color-black">
                        {attempt.grade ? `${attempt.grade}%` : "Pending"}
                      </p>
                    </td>
                    <td>
                      {attempt.feedback ? (
                        <p className="color-black" title={attempt.feedback}>
                          {attempt.feedback.length > 50
                            ? `${attempt.feedback.substring(0, 50)}...`
                            : attempt.feedback}
                        </p>
                      ) : (
                        <p className="color-gray">No feedback yet</p>
                      )}
                    </td>
                    <td>
                      <p className="color-black">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttemptsContent;
