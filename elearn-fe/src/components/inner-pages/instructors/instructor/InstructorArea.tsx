"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Instructor = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  skill?: string;
};

type Course = {
  _id: string;
  instructorId?:
    | string
    | {
        _id?: string;
        id?: string;
      };
};

const InstructorArea = () => {
  const apiBase = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getFullName = (i: Instructor) => {
    const name = `${i.firstName || ""} ${i.lastName || ""}`.trim();
    return name || i.username || "Instructor";
  };

  const getAvatarSrc = (i: Instructor) => {
    const url = i.avatarUrl;
    if (!url) return "/assets/img/instructor/instructor01.png";
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("/assets/")) return url;
    if (!apiBase) return url;
    return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const getInstructorIdFromCourse = (course: Course) => {
    const v: any = (course as any).instructorId;
    if (typeof v === "string") return v;
    return v?._id || v?.id || "";
  };

  useEffect(() => {
    const run = async () => {
      if (!apiBase) {
        setError("Missing NEXT_PUBLIC_API_GATEWAY_URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // 1) Fetch a slice of courses, derive instructorIds
        const courseRes = await fetch(`${apiBase}/api/elearn/course?page=1&limit=200`);
        const courseJson = await courseRes.json().catch(() => null);
        if (!courseRes.ok || courseJson?.status !== "success") {
          throw new Error(courseJson?.message || "Failed to load instructors.");
        }

        const rawCourses: Course[] = courseJson?.data?.courses || [];
        const ids = rawCourses
          .map(getInstructorIdFromCourse)
          .map((s) => String(s || "").trim())
          .filter(Boolean);
        const uniqueIds = Array.from(new Set(ids)).slice(0, 12);

        // 2) Fetch instructor profiles (public endpoint)
        const results = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await fetch(`${apiBase}/api/elearn/user/instructor/${id}`);
              const json = await res.json().catch(() => null);
              if (!res.ok || json?.status !== "success") return null;
              return json.data as Instructor;
            } catch {
              return null;
            }
          })
        );

        setInstructors(results.filter(Boolean) as Instructor[]);
      } catch (e: any) {
        setError(e?.message || "Failed to load instructors.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [apiBase]);

  const emptyMessage = useMemo(() => {
    if (loading) return "";
    if (error) return error;
    return "No instructors found yet.";
  }, [error, loading]);

  return (
    <section className="instructor__area pt-5">
      <div className="container">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : instructors.length === 0 ? (
          <div className="text-center py-5">{emptyMessage}</div>
        ) : (
          <div className="row">
            {instructors.map((item) => (
              <div key={item.id} className="col-xl-4 col-sm-6">
                <div className="instructor__item">
                  <div className="instructor__thumb">
                    <Link href={`/instructors/${item.id}`}>
                      <Image
                        src={getAvatarSrc(item)}
                        alt={getFullName(item)}
                        width={420}
                        height={320}
                        style={{ objectFit: "cover" }}
                      />
                    </Link>
                  </div>
                  <div className="instructor__content">
                    <h2 className="title">
                      <Link href={`/instructors/${item.id}`}>
                        {getFullName(item)}
                      </Link>
                    </h2>
                    <span className="designation">
                      {item.skill ? item.skill : "Instructor"}
                    </span>
                    <p className="avg-rating">
                      <i className="fas fa-star"></i>
                      Featured Instructor
                    </p>
                    <div className="instructor__social">
                      <ul className="list-wrap">
                        <li>
                          <Link href="/courses">
                            <i className="fas fa-book"></i>
                          </Link>
                        </li>
                        <li>
                          <Link href={`/instructors/${item.id}`}>
                            <i className="fas fa-user"></i>
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default InstructorArea;
