"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ReactPaginate from "react-paginate";
import CourseSidebar from "./CourseSidebar";
import CourseTop from "./CourseTop";

interface Course {
  _id: string;
  name: string;
  shortDescription: string;
  originalPrice: number;
  salePrice: number;
  thumbnail: string;
  targets: string[];
  requirements: string[];
  certificate: boolean;
  level: number;
  instructorId:
    | string
    | {
        _id?: string;
        id?: string;
        username?: string;
        firstName?: string;
        lastName?: string;
      };
  tag: string;
  createdAt: string;
  updatedAt: string;
}

interface Instructor {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  bio: string;
  skill: string;
  socialShare: string[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const CourseArea = () => {
  const searchParams = useSearchParams();
  const q = String(searchParams.get("q") || "").trim();

  // allCourses: the current "source list" for the page (after initial enrolled sorting)
  // courses: the currently displayed list (after client-side filters, if any)
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [instructors, setInstructors] = useState<Record<string, Instructor>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(12);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });
  const [isClientFiltering, setIsClientFiltering] = useState(false);

  const coursesRef = useRef<Course[]>([]);
  const enrolledCourseIdsRef = useRef<string[]>([]);

  const fetchInstructors = useCallback(async (instructorIds: string[]) => {
    try {
      const uniqueIds = [...new Set(instructorIds)];
      const instructorPromises = uniqueIds.map(async (id) => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/user/instructor/${id}`
          );
          const data = await response.json();
          return data.data;
        } catch (err) {
          console.error(`Error fetching instructor ${id}:`, err);
          return null;
        }
      });

      const instructorData = await Promise.all(instructorPromises);
      const instructorMap = instructorData.reduce((acc, instructor) => {
        if (instructor && instructor.id) {
          acc[instructor.id] = instructor;
        }
        return acc;
      }, {} as Record<string, Instructor>);

      setInstructors(instructorMap);
    } catch (err) {
      console.error("Error in fetchInstructors:", err);
    }
  }, []);

  const fetchEnrolledCourses = useCallback(async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/enroll`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          const enrolledIds = data.data.map((course: any) => course.id);
          setEnrolledCourseIds(enrolledIds);
          enrolledCourseIdsRef.current = enrolledIds;
        }
      }
    } catch (err) {
      console.error("Error fetching enrolled courses:", err);
    }
  }, []);

  const fetchCourses = useCallback(
    async (page: number = 1, query: string = "") => {
      try {
        setLoading(true);
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_GATEWAY_URL
          }/api/elearn/course?page=${page}&limit=${pageLimit}${
            query ? `&q=${encodeURIComponent(query)}` : ""
          }`
        );
        const data = await response.json();

        if (data.status === "success") {
          const rawCourses = data.data.courses;
          coursesRef.current = rawCourses;

          // Sort courses immediately with current enrolledCourseIds
          const sortedCourses = [...rawCourses].sort((a: Course, b: Course) => {
            const aEnrolled = enrolledCourseIdsRef.current.includes(a._id);
            const bEnrolled = enrolledCourseIdsRef.current.includes(b._id);
            if (aEnrolled && !bEnrolled) return -1;
            if (!aEnrolled && bEnrolled) return 1;
            return 0;
          });

          // Keep a stable base list for filters (current page/search results)
          setAllCourses(sortedCourses);
          setCourses(sortedCourses);
          setPagination(data.data.pagination);
          const instructorIds = rawCourses
            .map((course: Course) => {
              const v: any = (course as any).instructorId;
              return typeof v === "string" ? v : v?._id || v?.id || "";
            })
            .filter(Boolean);
          await fetchInstructors(instructorIds);
        } else {
          setError("Failed to fetch courses");
        }
      } catch (err) {
        setError("An error occurred while fetching courses");
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    },
    [pageLimit, fetchInstructors]
  );

  // Initial data fetch - only run once
  useEffect(() => {
    const initializeData = async () => {
      await fetchEnrolledCourses();
      await fetchCourses(currentPage, q);
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once

  // When query changes, reset to page 1 and refetch
  useEffect(() => {
    const run = async () => {
      setCurrentPage(1);
      await fetchCourses(1, q);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // Fetch courses when page changes
  useEffect(() => {
    if (currentPage > 1) {
      // Skip initial load
      fetchCourses(currentPage, q);
    }
  }, [currentPage, fetchCourses, q]);

  // Update courses when enrolledCourseIds changes (but not during initial load)
  useEffect(() => {
    if (coursesRef.current.length > 0 && enrolledCourseIds.length > 0) {
      const sortedCourses = [...coursesRef.current].sort(
        (a: Course, b: Course) => {
          const aEnrolled = enrolledCourseIds.includes(a._id);
          const bEnrolled = enrolledCourseIds.includes(b._id);
          if (aEnrolled && !bEnrolled) return -1;
          if (!aEnrolled && bEnrolled) return 1;
          return 0;
        }
      );
      setAllCourses(sortedCourses);
      setCourses(sortedCourses);
    }
  }, [enrolledCourseIds]);

  const handlePageClick = (event: { selected: number }) => {
    // Client-side filters only apply to the currently fetched page;
    // to avoid showing unfiltered items, disable server pagination while filtering.
    if (isClientFiltering) return;
    const newPage = event.selected + 1;
    setCurrentPage(newPage);
  };

  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: any) => {
    setActiveTab(index);
  };

  const getInstructorName = (course: Course) => {
    const v: any = (course as any).instructorId;

    // If backend already populated instructorId, use it directly
    if (v && typeof v === "object") {
      const full = `${v.firstName || ""} ${v.lastName || ""}`.trim();
      return full || v.username || "Unknown Instructor";
    }

    const id = typeof v === "string" ? v : "";
    const instructor = id ? instructors[id] : null;
    if (!instructor) return "Unknown Instructor";
    return `${instructor.firstName} ${instructor.lastName}`.trim();
  };

  const capitalizeFirstLetter = (text: string) => {
    const t = String(text || "").trim();
    if (!t) return "";
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  };

  const formatPrice = (n: any) => {
    const v = Number(n);
    if (!Number.isFinite(v)) return null;
    return `$${v}`;
  };

  const getPriceParts = (course: Course) => {
    const original = Number(course.originalPrice);
    const sale = Number(course.salePrice);

    const hasOriginal = Number.isFinite(original) && original > 0;
    const hasSale = Number.isFinite(sale) && sale > 0;

    // If sale exists and is lower than original -> show both (old crossed)
    if (hasOriginal && hasSale && sale < original) {
      return { original, sale };
    }

    // Otherwise show the best available price as "sale"
    if (hasSale) return { original: null as any, sale };
    if (hasOriginal) return { original: null as any, sale: original };

    // Free / missing
    return { original: null as any, sale: 0 };
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <section className="all-courses-area section-py-120">
      <div className="container">
        <div className="row">
          <CourseSidebar
            allCourses={allCourses}
            setCourses={setCourses}
            getInstructorName={getInstructorName}
            onFilteringChange={setIsClientFiltering}
          />
          <div className="col-xl-9 col-lg-8">
            <CourseTop
              startOffset={(currentPage - 1) * pageLimit + 1}
              endOffset={Math.min(currentPage * pageLimit, pagination.total)}
              totalItems={pagination.total}
              setCourses={setCourses}
              allCourses={allCourses}
              handleTabClick={handleTabClick}
              activeTab={activeTab}
            />
            {courses.length === 0 ? (
              <div className="text-center mt-30" role="alert">
                No course matched for your filter.
              </div>
            ) : (
              <>
                {activeTab === 0 ? (
                  <div className="row courses__grid-wrap row-cols-1 row-cols-xl-3 row-cols-lg-2 row-cols-md-2 row-cols-sm-1">
                    {courses.map((course) => (
                      <div key={course._id} className="col mb-4">
                        <div className="courses__item shine__animate-item">
                          <div className="courses__item-thumb">
                            <Link
                              href={`/courses/${course._id}`}
                              className="shine__animate-link"
                            >
                              <Image
                                src={course.thumbnail}
                                alt={course.name}
                                width={350}
                                height={200}
                              />
                            </Link>
                          </div>
                          <div className="courses__item-content">
                            <ul className="courses__item-meta list-wrap">
                              <li className="courses__item-tag">
                                <Link href="/course">
                                  {capitalizeFirstLetter(course.tag)}
                                </Link>
                              </li>
                              <li className="avg-rating">
                                <i className="fas fa-star"></i> Level{" "}
                                {course.level}
                              </li>
                            </ul>
                            <h5 className="title">
                              <Link href={`/courses/${course._id}`}>
                                {course.name}
                              </Link>
                            </h5>
                            <p className="author">
                              By{" "}
                              <Link href="#">{getInstructorName(course)}</Link>
                            </p>
                            <div
                              className="courses__item-bottom"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div className="button">
                                <Link href={`/courses/${course._id}`}>
                                  <span className="text">
                                    {enrolledCourseIds.includes(course._id)
                                      ? "Continue Learning"
                                      : "Enroll Now"}
                                  </span>
                                  <i className="flaticon-arrow-right"></i>
                                </Link>
                              </div>
                              {!enrolledCourseIds.includes(course._id) &&
                                (() => {
                                  const p = getPriceParts(course);
                                  const saleText =
                                    p.sale && p.sale > 0
                                      ? formatPrice(p.sale)
                                      : "Free";
                                  const originalText =
                                    p.original && p.original > 0
                                      ? formatPrice(p.original)
                                      : null;
                                  return (
                                    <h5 className="price">
                                      {originalText ? (
                                        <del style={{ marginRight: 8 }}>
                                          {originalText}
                                        </del>
                                      ) : null}
                                      <span>{saleText}</span>
                                    </h5>
                                  );
                                })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="row courses__list-wrap row-cols-1">
                    {courses.map((course) => (
                      <div key={course._id} className="col">
                        <div className="courses__item courses__item-three shine__animate-item">
                          <div className="courses__item-thumb">
                            <Link
                              href={`/courses/${course._id}`}
                              className="shine__animate-link"
                            >
                              <Image
                                src={course.thumbnail}
                                alt={course.name}
                                width={350}
                                height={200}
                              />
                            </Link>
                          </div>
                          <div className="courses__item-content">
                            <ul className="courses__item-meta list-wrap">
                              <li className="courses__item-tag">
                                <Link href="/course">
                                  {capitalizeFirstLetter(course.tag)}
                                </Link>
                                <div className="avg-rating">
                                  <i className="fas fa-star"></i> Level{" "}
                                  {course.level}
                                </div>
                              </li>
                              {!enrolledCourseIds.includes(course._id) && (
                                <li className="price">
                                  {(() => {
                                    const p = getPriceParts(course);
                                    const saleText =
                                      p.sale && p.sale > 0
                                        ? formatPrice(p.sale)
                                        : "Free";
                                    const originalText =
                                      p.original && p.original > 0
                                        ? formatPrice(p.original)
                                        : null;
                                    return (
                                      <>
                                        {originalText ? (
                                          <del style={{ marginRight: 8 }}>
                                            {originalText}
                                          </del>
                                        ) : null}
                                        <span>{saleText}</span>
                                      </>
                                    );
                                  })()}
                                </li>
                              )}
                              {enrolledCourseIds.includes(course._id) && (
                                <li className="enrolled">Enrolled</li>
                              )}
                            </ul>
                            <h5 className="title">
                              <Link href={`/courses/${course._id}`}>
                                {course.name}
                              </Link>
                            </h5>
                            <p className="author">
                              By{" "}
                              <Link href="#">{getInstructorName(course)}</Link>
                            </p>
                            <p className="info">{course.shortDescription}</p>
                            <div className="courses__item-bottom">
                              <div className="button">
                                <Link href={`/courses/${course._id}`}>
                                  <span className="text">
                                    {enrolledCourseIds.includes(course._id)
                                      ? "Continue Learning"
                                      : "Enroll Now"}
                                  </span>
                                  <i className="flaticon-arrow-right"></i>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isClientFiltering && pagination.totalPages > 1 && (
                  <nav className="pagination__wrap mt-30">
                    <ReactPaginate
                      breakLabel="..."
                      onPageChange={handlePageClick}
                      pageRangeDisplayed={3}
                      pageCount={pagination.totalPages}
                      renderOnZeroPageCount={null}
                      className="list-wrap"
                      forcePage={currentPage - 1}
                    />
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CourseArea;
