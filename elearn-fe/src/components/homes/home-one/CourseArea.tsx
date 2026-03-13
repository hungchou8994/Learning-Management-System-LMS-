"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";

type Course = {
  _id: string;
  name: string;
  thumbnail?: string;
  tag?: string;
  rating?: number;
  originalPrice?: number;
  salePrice?: number;
  instructorId?:
    | string
    | {
        username?: string;
        firstName?: string;
        lastName?: string;
      };
};

// slider setting
const setting = {
  slidesPerView: 4,
  loop: true,
  spaceBetween: 30,
  observer: true,
  observeParents: true,
  autoplay: false,
  // Navigation arrows
  navigation: {
    nextEl: ".courses-button-next",
    prevEl: ".courses-button-prev",
  },
  breakpoints: {
    "1500": {
      slidesPerView: 4,
    },
    "1200": {
      slidesPerView: 4,
    },
    "992": {
      slidesPerView: 3,
      spaceBetween: 24,
    },
    "768": {
      slidesPerView: 2,
      spaceBetween: 24,
    },
    "576": {
      slidesPerView: 1,
    },
    "0": {
      slidesPerView: 1,
    },
  },
};

const CourseArea = ({ style }: any) => {
  const [activeTab, setActiveTab] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleTabClick = (index: any) => {
    setActiveTab(index);
  };

  const normalize = useCallback((v: any) => String(v || "").trim(), []);
  const capitalizeFirstLetter = useCallback(
    (text: string) => {
      const t = normalize(text);
      if (!t) return "";
      return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    },
    [normalize]
  );

  const getInstructorName = (course: Course) => {
    const v: any = (course as any).instructorId;
    if (v && typeof v === "object") {
      const full = `${v.firstName || ""} ${v.lastName || ""}`.trim();
      return full || v.username || "Instructor";
    }
    return "Instructor";
  };

  const getDisplayPrice = (course: Course) => {
    const sale = Number((course as any)?.salePrice);
    const original = Number((course as any)?.originalPrice);
    const p = Number.isFinite(sale) ? sale : original;
    return Number.isFinite(p) ? p : 0;
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/api/elearn/course?page=1&limit=24`
        );
        const data = await res.json();
        if (data?.status !== "success") {
          throw new Error(data?.message || "Failed to load courses");
        }
        setCourses(Array.isArray(data?.data?.courses) ? data.data.courses : []);
      } catch (e: any) {
        setError(e?.message || "Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const topTags = useMemo(() => {
    const tags = courses.map((c) => normalize(c.tag)).filter(Boolean);
    const uniq = Array.from(new Set(tags));
    return uniq.slice(0, 3);
  }, [courses, normalize]);

  const tabTitles = useMemo(() => {
    return ["All Courses", ...topTags.map(capitalizeFirstLetter)];
  }, [topTags, capitalizeFirstLetter]);

  const activeTag = topTags[activeTab - 1] || "";
  const filteredCourses =
    activeTab === 0
      ? courses
      : courses.filter(
          (c) => normalize(c.tag).toLowerCase() === activeTag.toLowerCase()
        );

  return (
    <section
      className={`courses-area ${
        style ? "section-py-120" : "section-pt-120 section-pb-90"
      }`}
      style={{ backgroundImage: `url(/assets/img/bg/courses_bg.jpg )` }}
    >
      <div className="container">
        <div className="section__title-wrap">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="section__title text-center mb-40">
                <span className="sub-title">Featured Courses</span>
                <h2 className="title">Explore Courses You Can Start Today</h2>
                <p className="desc">
                  Fresh content, practical projects, and clear learning
                  paths—built for real progress.
                </p>
              </div>
              <div className="courses__nav">
                <ul className="nav nav-tabs" id="courseTab" role="tablist">
                  {tabTitles.map((tab, index) => (
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
              </div>
            </div>
          </div>
        </div>

        <div className="tab-content" id="courseTabContent">
          {loading ? (
            <div className="text-center py-5">Loading courses...</div>
          ) : error ? (
            <div className="text-center py-5">{error}</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-5">
              No courses available in this category yet.
            </div>
          ) : (
            <div className="tab-pane fade show active" role="tabpanel">
              <Swiper
                {...setting}
                modules={[Autoplay, Navigation]}
                className="swiper courses-swiper-active"
              >
                {filteredCourses.map((item) => (
                  <SwiperSlide key={item._id} className="swiper-slide">
                    <div className="courses__item shine__animate-item">
                      <div className="courses__item-thumb">
                        <Link
                          href={`/courses/${item._id}`}
                          className="shine__animate-link"
                        >
                          <Image
                            src={
                              item.thumbnail ||
                              "/assets/img/courses/course_thumb01.jpg"
                            }
                            alt={item.name}
                            width={420}
                            height={240}
                          />
                        </Link>
                      </div>
                      <div className="courses__item-content">
                        <ul className="courses__item-meta list-wrap">
                          <li className="courses__item-tag">
                            <Link href="/courses">
                              {capitalizeFirstLetter(item.tag || "Course")}
                            </Link>
                          </li>
                          <li className="avg-rating">
                            <i className="fas fa-star"></i>{" "}
                            {(Number(item.rating || 0) || 0).toFixed(1)}
                          </li>
                        </ul>
                        <h5 className="title">
                          <Link href={`/courses/${item._id}`}>{item.name}</Link>
                        </h5>
                        <p className="author">
                          By <Link href="#">{getInstructorName(item)}</Link>
                        </p>
                        <div className="courses__item-bottom">
                          <div className="button">
                            <Link href={`/courses/${item._id}`}>
                              <span className="text">Enroll Now</span>
                              <i className="flaticon-arrow-right"></i>
                            </Link>
                          </div>
                          <h5 className="price">
                            {getDisplayPrice(item) <= 0
                              ? "Free"
                              : `$${getDisplayPrice(item)}`}
                          </h5>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
              {!style && (
                <div className="courses__nav">
                  <div className="courses-button-prev">
                    <i className="flaticon-arrow-right"></i>
                  </div>
                  <div className="courses-button-next">
                    <i className="flaticon-arrow-right"></i>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CourseArea;
