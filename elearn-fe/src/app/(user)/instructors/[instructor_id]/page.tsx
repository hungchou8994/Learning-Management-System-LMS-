"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import HeaderOne from "@/layouts/headers/HeaderOne";
import FooterOne from "@/layouts/footers/FooterOne";

type Instructor = {
  id: string;
  _id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  skill?: string;
  socialShare?: string[];
};

type Course = {
  _id: string;
  name: string;
  shortDescription?: string;
  thumbnail?: string;
  tag?: string;
  level?: number;
  originalPrice?: number;
  salePrice?: number;
  rating?: number;
  instructorId?:
    | string
    | {
        _id?: string;
        id?: string;
        username?: string;
        firstName?: string;
        lastName?: string;
      };
};

export default function InstructorDetailsPage() {
  const params = useParams<{ instructor_id: string }>();
  const instructorId = String(params?.instructor_id || "").trim();

  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  const fullName = useMemo(() => {
    if (!instructor) return "";
    const name = `${instructor.firstName || ""} ${instructor.lastName || ""}`.trim();
    return name || instructor.username || "Instructor";
  }, [instructor]);

  const avatarSrc = useMemo(() => {
    const url = instructor?.avatarUrl;
    if (!url) return "/assets/img/instructor/instructor_details_thumb.png";
    // avatarUrl can be:
    // - absolute URL (http/https)
    // - local asset path (/assets/...) served by the frontend
    // - relative upload path (/uploads/...) served by API gateway
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/assets/")) return url;
    if (!apiBase) return url;
    return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
  }, [apiBase, instructor?.avatarUrl]);

  const getCourseInstructorId = (course: Course) => {
    const v: any = (course as any).instructorId;
    if (typeof v === "string") return v;
    return v?._id || v?.id || "";
  };

  const getDisplayPrice = (course: Course) => {
    const sale = Number(course?.salePrice);
    const original = Number(course?.originalPrice);
    const p = Number.isFinite(sale) ? sale : original;
    return Number.isFinite(p) ? p : 0;
  };

  const capitalizeFirstLetter = (text?: string) => {
    const t = String(text || "").trim();
    if (!t) return "";
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  };

  useEffect(() => {
    const run = async () => {
      if (!instructorId) {
        setError("Missing instructor id.");
        setLoading(false);
        return;
      }
      if (!apiBase) {
        setError("Missing NEXT_PUBLIC_API_GATEWAY_URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [instructorRes, coursesRes] = await Promise.all([
          fetch(`${apiBase}/api/elearn/user/instructor/${encodeURIComponent(instructorId)}`),
          fetch(`${apiBase}/api/elearn/course?page=1&limit=100`),
        ]);

        const instructorJson = await instructorRes.json().catch(() => null);
        if (!instructorRes.ok || instructorJson?.status !== "success") {
          throw new Error(instructorJson?.message || "Failed to load instructor.");
        }

        const data: Instructor = instructorJson.data;
        setInstructor(data);

        const coursesJson = await coursesRes.json().catch(() => null);
        const rawCourses: Course[] =
          coursesJson?.status === "success" ? coursesJson?.data?.courses || [] : [];

        const filtered = rawCourses.filter(
          (c) => String(getCourseInstructorId(c)) === String(instructorId)
        );
        setCourses(filtered);
      } catch (e: any) {
        setError(e?.message || "Failed to load instructor page.");
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, instructorId]);

  return (
    <>
      <HeaderOne />
      <main className="main-area fix">
        <section className="instructor__details-area section-pt-120 section-pb-90">
          <div className="container">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : !instructor ? (
              <div className="alert alert-warning" role="alert">
                Instructor not found.
              </div>
            ) : (
              <div className="row">
                <div className="col-xl-9">
                  <div className="instructor__details-wrap">
                    <div className="instructor__details-info">
                      <div className="instructor__details-thumb">
                        <Image
                          src={avatarSrc}
                          alt={fullName}
                          width={260}
                          height={260}
                          style={{ objectFit: "cover", borderRadius: "16px" }}
                        />
                      </div>
                      <div className="instructor__details-content">
                        <h2 className="title">{fullName}</h2>
                        <span className="designation">
                          {instructor.skill ? instructor.skill : "Instructor"}
                        </span>
                        <ul className="list-wrap">
                          {instructor.username ? (
                            <li>
                              <i className="far fa-user"></i>@{instructor.username}
                            </li>
                          ) : null}
                          <li>
                            <i className="far fa-bookmark"></i>
                            {courses.length} course{courses.length === 1 ? "" : "s"}
                          </li>
                        </ul>
                        <p>
                          {instructor.bio
                            ? instructor.bio
                            : "This instructor hasn’t added a bio yet."}
                        </p>

                        {Array.isArray(instructor.socialShare) &&
                        instructor.socialShare.length > 0 ? (
                          <div className="instructor__details-social">
                            <ul className="list-wrap">
                              {instructor.socialShare.map((url, idx) => (
                                <li key={idx}>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <i className="fas fa-link"></i>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="instructor__details-biography">
                      <h4 className="title">About</h4>
                      <p>
                        {instructor.bio
                          ? instructor.bio
                          : "This instructor profile will be updated soon with more details."}
                      </p>
                    </div>

                    <div className="instructor__details-Skill">
                      <h4 className="title">Skills</h4>
                      <p>
                        {instructor.skill
                          ? `Primary focus: ${instructor.skill}.`
                          : "Skills are not listed yet."}
                      </p>
                    </div>

                    <div className="instructor__details-courses">
                      <div className="row align-items-center mb-30">
                        <div className="col-md-8">
                          <h2 className="main-title">Courses</h2>
                          <p className="desc">
                            Browse courses published by {fullName}.
                          </p>
                        </div>
                        <div className="col-md-4 text-md-end">
                          <Link href="/courses" className="btn btn-two">
                            View all courses
                          </Link>
                        </div>
                      </div>

                      {courses.length === 0 ? (
                        <div className="text-center mt-30">
                          No courses found for this instructor yet.
                        </div>
                      ) : (
                        <div className="row courses__grid-wrap row-cols-1 row-cols-xl-3 row-cols-lg-2 row-cols-md-2 row-cols-sm-1">
                          {courses.slice(0, 12).map((course) => (
                            <div key={course._id} className="col mb-4">
                              <div className="courses__item shine__animate-item">
                                <div className="courses__item-thumb">
                                  <Link
                                    href={`/courses/${course._id}`}
                                    className="shine__animate-link"
                                  >
                                    <Image
                                      src={
                                        course.thumbnail ||
                                        "/assets/img/courses/course_thumb01.jpg"
                                      }
                                      alt={course.name}
                                      width={350}
                                      height={200}
                                    />
                                  </Link>
                                </div>
                                <div className="courses__item-content">
                                  <ul className="courses__item-meta list-wrap">
                                    <li className="courses__item-tag">
                                      <Link href="/courses">
                                        {capitalizeFirstLetter(course.tag) || "Course"}
                                      </Link>
                                    </li>
                                    <li className="avg-rating">
                                      <i className="fas fa-star"></i> Level{" "}
                                      {course.level ?? 1}
                                    </li>
                                  </ul>
                                  <h5 className="title">
                                    <Link href={`/courses/${course._id}`}>
                                      {course.name}
                                    </Link>
                                  </h5>
                                  <p className="author">
                                    By <Link href="#">{fullName}</Link>
                                  </p>
                                  <div className="courses__item-bottom">
                                    <div className="button">
                                      <Link href={`/courses/${course._id}`}>
                                        <span className="text">View course</span>
                                        <i className="flaticon-arrow-right"></i>
                                      </Link>
                                    </div>
                                    <h5 className="price">
                                      {getDisplayPrice(course) <= 0
                                        ? "Free"
                                        : `$${getDisplayPrice(course)}`}
                                    </h5>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-xl-3">
                  <div className="instructor__sidebar">
                    <h4 className="title">Quick Links</h4>
                    <p>Explore more content on the platform.</p>
                    <div className="tg-button-wrap d-grid gap-2">
                      <Link href="/courses" className="btn btn-two">
                        Browse courses
                      </Link>
                      <Link href="/instructors" className="btn btn-three">
                        Back to instructors
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <FooterOne />
    </>
  );
}