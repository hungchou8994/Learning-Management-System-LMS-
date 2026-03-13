"use client";
import VideoPopup from "@/modals/VideoPopup";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import InjectableSvg from "@/hooks/InjectableSvg";
import BtnArrow from "@/svg/BtnArrow";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/features/cartSlice";

import img_1 from "@/assets/img/courses/course_thumb02.jpg";
import img_2 from "@/assets/img/others/payment.png";

interface Course {
  _id: string;
  name: string;
  description: string;
  shortDescription: string;
  originalPrice: number;
  salePrice?: number;
  thumbnail: string;
  level: number;
  certificate: boolean;
  sessions: any[];
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
}

interface SidebarProps {
  course: Course;
  isEnrolled: boolean;
}

const Sidebar = ({ course, isEnrolled }: SidebarProps) => {
  const [isVideoOpen, setIsVideoOpen] = useState<boolean>(false);
  const dispatch = useDispatch();

  // Calculate total lessons
  const totalLessons = course.sessions.reduce(
    (total, session) => total + session.lessons.length,
    0
  );

  // Calculate total duration in minutes
  const totalDurationMinutes = course.sessions.reduce((total, session) => {
    return (
      total +
      session.lessons.reduce(
        (sessionTotal: number, lesson: any) =>
          sessionTotal + (lesson.duration || 0),
        0
      )
    );
  }, 0);

  // Convert minutes to hours and minutes
  const hours = Math.floor(totalDurationMinutes / 60);
  const minutes = totalDurationMinutes % 60;

  // Map level number to text
  const levelMap: { [key: number]: string } = {
    1: "Novice",
    2: "Beginner",
    3: "Intermediate",
    4: "Advanced",
    5: "Expert",
  };

  return (
    <div className="courses__details-sidebar">
      <div className="courses__details-video">
        <Image
          src={course.thumbnail || img_1}
          alt={course.name}
          width={500}
          height={300}
        />
        <a
          onClick={() => setIsVideoOpen(true)}
          style={{ cursor: "pointer" }}
          className="popup-video"
        >
          <i className="fas fa-play"></i>
        </a>
      </div>

      <div className="courses__cost-wrap">
        <span>This Course Fee:</span>
        <h2 className="title">
          ${course.salePrice?.toFixed(2) || course.originalPrice.toFixed(2)}{" "}
          <del>${course.originalPrice.toFixed(2)}</del>
        </h2>
      </div>

      {!isEnrolled && (
        <div
          className="courses__payment"
          style={{
            display: "flex",
            justifyContent: "center",
            border: "none",
            paddingBottom: "0px",
          }}
        >
          <button
            onClick={() => {
              const fullThumbnailUrl = course.thumbnail
                ? `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/course/thumbnail/${course._id}`
                : "/assets/img/courses/courses_details.jpg";

              dispatch(
                addToCart({
                  id: course._id,
                  title: course.name,
                  quantity: 1,
                  price: course.salePrice || course.originalPrice,
                  thumb: course.thumbnail || fullThumbnailUrl,
                })
              );
            }}
            className="btn btn-two arrow-btn mb-20"
          >
            Add to Cart 🛒
          </button>
        </div>
      )}

      {isEnrolled && (
        <div
          className="courses__payment"
          style={{
            display: "flex",
            justifyContent: "center",
            border: "none",
            paddingBottom: "0px",
          }}
        >
          <Link href={`/learning/${course._id}`}>
            <button className="btn btn-two arrow-btn mb-20">
              Continue Learning 📚
            </button>
          </Link>
        </div>
      )}

      <div className="courses__information-wrap">
        <h5 className="title">Course includes:</h5>
        <ul className="list-wrap">
          <li>
            <InjectableSvg
              src="/assets/img/icons/course_icon01.svg"
              alt="img"
              className="injectable"
            />
            Level
            <span>{levelMap[course.level] || "Beginner"}</span>
          </li>
          <li>
            <InjectableSvg
              src="/assets/img/icons/course_icon02.svg"
              alt="img"
              className="injectable"
            />
            Duration
            <span>
              {hours}h {minutes}m
            </span>
          </li>
          <li>
            <InjectableSvg
              src="/assets/img/icons/course_icon03.svg"
              alt="img"
              className="injectable"
            />
            Lessons
            <span>{totalLessons}</span>
          </li>
          <li>
            <InjectableSvg
              src="/assets/img/icons/course_icon04.svg"
              alt="img"
              className="injectable"
            />
            Assignments
            <span>{course.sessions.length}</span>
          </li>
          <li>
            <InjectableSvg
              src="/assets/img/icons/course_icon05.svg"
              alt="img"
              className="injectable"
            />
            Certifications
            <span>{course.certificate ? "Yes" : "No"}</span>
          </li>
          <li>
            <InjectableSvg
              src="/assets/img/icons/course_icon06.svg"
              alt="img"
              className="injectable"
            />
            Graduation
            <span>0</span>
          </li>
        </ul>
      </div>

      <div className="courses__payment">
        <h5 className="title">Secure Payment:</h5>
        <Image src={img_2} alt="Payment methods" />
      </div>
      <div className="courses__details-social">
        <h5 className="title">Share this course:</h5>
        <ul className="list-wrap">
          <li>
            <Link href="#">
              <i className="fab fa-facebook-f"></i>
            </Link>
          </li>
          <li>
            <Link href="#">
              <i className="fab fa-twitter"></i>
            </Link>
          </li>
          <li>
            <Link href="#">
              <i className="fab fa-whatsapp"></i>
            </Link>
          </li>
          <li>
            <Link href="#">
              <i className="fab fa-instagram"></i>
            </Link>
          </li>
          <li>
            <Link href="#">
              <i className="fab fa-youtube"></i>
            </Link>
          </li>
        </ul>
      </div>
      <div className="courses__details-enroll">
        <div className="tg-button-wrap">
          <Link href="/courses" className="btn btn-two arrow-btn">
            See All Instructors
            <BtnArrow />
          </Link>
        </div>
      </div>
      {isVideoOpen && (
        <VideoPopup
          isVideoOpen={isVideoOpen}
          setIsVideoOpen={setIsVideoOpen}
          videoId={course.thumbnail}
        />
      )}
    </div>
  );
};

export default Sidebar;
