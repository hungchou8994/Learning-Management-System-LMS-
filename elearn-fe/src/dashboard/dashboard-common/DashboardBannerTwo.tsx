"use client";

import { useEffect, useState } from "react";
import BtnArrow from "@/svg/BtnArrow";
import Image from "next/image";
import Link from "next/link";
import InjectableSvg from "@/hooks/InjectableSvg";
import defaultAvatar from "@/assets/img/courses/details_instructors02.jpg";

interface UserProfile {
  firstName: string;
  lastName: string;
  avatarUrl: string;
  coverUrl: string;
}

interface EnrolledCourse {
  id: string;
  progress: number;
  certificate?: boolean;
}

const DashboardBannerTwo = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    avatarUrl: "",
    coverUrl: "",
  });
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/user/user`,
          {
            credentials: "include",
          }
        );

        if (!profileResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const profileData = await profileResponse.json();
        setUserProfile({
          firstName: profileData.data.firstName || "",
          lastName: profileData.data.lastName || "",
          avatarUrl: profileData.data.avatarUrl
            ? `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/elearn${profileData.data.avatarUrl}`
            : "",
          coverUrl: profileData.data.coverUrl
            ? `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/elearn${profileData.data.coverUrl}`
            : "",
        });

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
          setEnrolledCourses(coursesData.data);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch user data"
        );
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate stats from enrolled courses
  const enrolledCount = enrolledCourses.length;
  const completedCount = enrolledCourses.filter(
    (course) => (course.progress || 0) === 100
  ).length;
  const certificateCount = enrolledCourses.filter(
    (course) => course.certificate
  ).length;

  const displayName =
    userProfile.firstName && userProfile.lastName
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : "User";

  if (isLoading) {
    return (
      <div className="dashboard__top-wrap">
        <div className="dashboard__top-bg"></div>
        <div className="dashboard__instructor-info">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard__top-wrap">
        <div className="dashboard__top-bg"></div>
        <div className="dashboard__instructor-info">
          <div className="alert alert-danger">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard__top-wrap">
      <div className="dashboard__top-bg">
        <Image
          className="dashboard__top-bg"
          src={userProfile.coverUrl || "/assets/img/bg/student_bg.jpg"}
          alt="Profile cover"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>
      <div className="dashboard__instructor-info">
        <div className="dashboard__instructor-info-left">
          <div className="thumb">
            <Image
              src={userProfile.avatarUrl || defaultAvatar}
              alt={`${displayName}'s avatar`}
              width={100}
              height={100}
            />
          </div>
          <div
            className="content"
            style={{
              textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
              color: "#ffffff",
              borderRadius: "16px",
            }}
          >
            <h4
              className="title"
              style={{
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.8)",
                fontWeight: "600",
              }}
            >
              {displayName}
            </h4>
            <ul
              className="list-wrap"
              style={{
                textShadow: "0.5px 0.5px 1px rgba(0, 0, 0, 0.8)",
              }}
            >
              <li>
                <InjectableSvg
                  src="/assets/img/icons/course_icon03.svg"
                  alt="courses icon"
                  className="injectable"
                />
                Courses Enrolled
                <span>{enrolledCount}</span>
              </li>
              <li>
                <InjectableSvg
                  src="/assets/img/icons/course_icon05.svg"
                  alt="certificate icon"
                  className="injectable"
                />
                Certificates
                <span>{certificateCount}</span>
              </li>
              <li>
                <InjectableSvg
                  src="/assets/img/icons/course_icon04.svg"
                  alt="completion icon"
                  className="injectable"
                />
                Completed
                <span>{completedCount}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="dashboard__instructor-info-right">
          <Link
            href="http://localhost:3008/messenger"
            className="btn btn-two arrow-btn"
          >
            Open Messenger <i className="fas fa-envelope"></i>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardBannerTwo;
