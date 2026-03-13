import { useCallback, useEffect, useMemo, useState } from "react";
import { Rating } from "react-simple-star-rating";

type Props = {
  allCourses: any[];
  setCourses: (courses: any[]) => void;
  getInstructorName?: (course: any) => string;
  onFilteringChange?: (active: boolean) => void;
};

const CourseSidebar = ({
  allCourses,
  setCourses,
  getInstructorName,
  onFilteringChange,
}: Props) => {
  const [showMoreTag, setShowMoreTag] = useState(false);
  const [showMoreInstructor, setShowMoreInstructor] = useState(false);

  const [tagSelected, setTagSelected] = useState("");
  const [levelSelected, setLevelSelected] = useState<number | "">("");
  const [priceSelected, setPriceSelected] = useState<"" | "free" | "paid">("");
  const [certificateSelected, setCertificateSelected] = useState<
    "" | "with" | "without"
  >("");
  const [instructorSelected, setInstructorSelected] = useState("");
  const [ratingSelected, setRatingSelected] = useState<number | null>(null);

  const normalize = useCallback((v: any) => String(v || "").trim(), []);

  const getTag = useCallback(
    (course: any) => normalize(course?.tag ?? course?.category ?? ""),
    [normalize]
  );

  const getLevel = useCallback((course: any) => {
    const v = course?.level ?? course?.skill_level;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, []);

  const getDisplayPrice = useCallback((course: any) => {
    const sale = Number(course?.salePrice);
    const original = Number(course?.originalPrice);
    // salePrice may legitimately be 0 (free) so treat any finite number as the display price
    const p = Number.isFinite(sale) ? sale : original;
    return Number.isFinite(p) ? p : 0;
  }, []);

  const isFree = useCallback(
    (course: any) => getDisplayPrice(course) <= 0,
    [getDisplayPrice]
  );

  const hasCertificate = useCallback(
    (course: any) => Boolean(course?.certificate),
    []
  );

  const getInstructor = useCallback(
    (course: any) => {
      if (getInstructorName) return normalize(getInstructorName(course));
      // fallback: best-effort if caller doesn't pass helper
      const v = course?.instructorId;
      if (v && typeof v === "object") {
        const full = `${v.firstName || ""} ${v.lastName || ""}`.trim();
        return normalize(full || v.username || "");
      }
      return "";
    },
    [getInstructorName, normalize]
  );

  const tagOptions = useMemo(() => {
    const tags = allCourses.map(getTag).filter(Boolean);
    return ["All Tags", ...Array.from(new Set(tags))];
  }, [allCourses, getTag]);

  const levelOptions = useMemo(() => {
    const levels = allCourses
      .map(getLevel)
      .filter((v): v is number => typeof v === "number")
      .sort((a, b) => a - b);
    return ["All Levels", ...Array.from(new Set(levels))];
  }, [allCourses, getLevel]);

  const instructorOptions = useMemo(() => {
    const names = allCourses.map(getInstructor).filter(Boolean);
    return ["All Instructors", ...Array.from(new Set(names))];
  }, [allCourses, getInstructor]);

  const capitalizeFirstLetter = useCallback((text: string) => {
    const t = String(text || "").trim();
    if (!t) return "";
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  }, []);

  const applyFilters = () => {
    let filtered = [...allCourses];

    if (tagSelected) {
      filtered = filtered.filter((c) => getTag(c) === tagSelected);
    }

    if (levelSelected !== "") {
      filtered = filtered.filter((c) => getLevel(c) === levelSelected);
    }

    if (priceSelected) {
      filtered = filtered.filter((c) =>
        priceSelected === "free" ? isFree(c) : !isFree(c)
      );
    }

    if (certificateSelected) {
      filtered = filtered.filter((c) =>
        certificateSelected === "with" ? hasCertificate(c) : !hasCertificate(c)
      );
    }

    if (instructorSelected) {
      filtered = filtered.filter(
        (c) => getInstructor(c) === instructorSelected
      );
    }

    if (ratingSelected) {
      filtered = filtered.filter(
        (c) => Number(c?.rating || 0) >= ratingSelected
      );
    }

    setCourses(filtered);
  };

  // Re-apply filters whenever the base list or any selected filter changes
  useEffect(() => {
    applyFilters();
    const filteringActive =
      Boolean(tagSelected) ||
      levelSelected !== "" ||
      Boolean(priceSelected) ||
      Boolean(certificateSelected) ||
      Boolean(instructorSelected) ||
      Boolean(ratingSelected);
    onFilteringChange?.(filteringActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allCourses,
    tagSelected,
    levelSelected,
    priceSelected,
    certificateSelected,
    instructorSelected,
    ratingSelected,
    onFilteringChange,
  ]);

  // UI list truncation
  const tagsToShow = showMoreTag ? tagOptions : tagOptions.slice(0, 8);
  const instructorsToShow = showMoreInstructor
    ? instructorOptions
    : instructorOptions.slice(0, 4);

  return (
    <div className="col-xl-3 col-lg-4">
      <aside className="courses__sidebar">
        <div className="courses-widget">
          <h4 className="widget-title">Tags</h4>
          <div className="courses-cat-list">
            <ul className="list-wrap">
              {tagsToShow.map((tag: any, i: any) => (
                <li key={i}>
                  <div
                    onClick={() => {
                      if (tag === "All Tags") return setTagSelected("");
                      setTagSelected((prev) => (prev === tag ? "" : tag));
                    }}
                    className="form-check"
                  >
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={
                        tag === "All Tags"
                          ? tagSelected === ""
                          : tag === tagSelected
                      }
                      readOnly
                      id={`tag_${i}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`tag_${i}`}
                      onClick={() => {
                        if (tag === "All Tags") return setTagSelected("");
                        setTagSelected((prev) => (prev === tag ? "" : tag));
                      }}
                    >
                      {tag === "All Tags" ? tag : capitalizeFirstLetter(tag)}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
            <div className="show-more">
              <a
                className={`show-more-btn ${showMoreTag ? "active" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => setShowMoreTag(!showMoreTag)}
              >
                {showMoreTag ? "Show Less -" : "Show More +"}
              </a>
            </div>
          </div>
        </div>

        {/* Level Filter */}
        <div className="courses-widget">
          <h4 className="widget-title">Level</h4>
          <div className="courses-cat-list">
            <ul className="list-wrap">
              {levelOptions.map((level: any, i: any) => (
                <li key={i}>
                  <div
                    onClick={() => {
                      if (level === "All Levels") {
                        setLevelSelected("");
                      } else {
                        const n = Number(level);
                        setLevelSelected((prev) => (prev === n ? "" : n));
                      }
                    }}
                    className="form-check"
                  >
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={
                        level === "All Levels"
                          ? levelSelected === ""
                          : Number(level) === levelSelected
                      }
                      readOnly
                      id={`level_${i}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`level_${i}`}
                      onClick={() => {
                        if (level === "All Levels") {
                          setLevelSelected("");
                        } else {
                          const n = Number(level);
                          setLevelSelected((prev) => (prev === n ? "" : n));
                        }
                      }}
                    >
                      {typeof level === "number" ? `Level ${level}` : level}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Price Filter */}
        <div className="courses-widget">
          <h4 className="widget-title">Price</h4>
          <div className="courses-cat-list">
            <ul className="list-wrap">
              {(
                [
                  { key: "", label: "All Price" },
                  { key: "free", label: "Free" },
                  { key: "paid", label: "Paid" },
                ] as const
              ).map((p, i) => (
                <li key={i}>
                  <div
                    onClick={() => {
                      setPriceSelected((prev) => (prev === p.key ? "" : p.key));
                    }}
                    className="form-check"
                  >
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={priceSelected === p.key}
                      readOnly
                      id={`price_${i}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`price_${i}`}
                      onClick={() => {
                        setPriceSelected((prev) =>
                          prev === p.key ? "" : p.key
                        );
                      }}
                    >
                      {p.label}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Certificate Filter */}
        <div className="courses-widget">
          <h4 className="widget-title">Certificate</h4>
          <div className="courses-cat-list">
            <ul className="list-wrap">
              {(
                [
                  { key: "", label: "All Certificates" },
                  { key: "with", label: "With certificate" },
                  { key: "without", label: "No certificate" },
                ] as const
              ).map((c, i) => (
                <li key={i}>
                  <div
                    onClick={() => {
                      setCertificateSelected((prev) =>
                        prev === c.key ? "" : c.key
                      );
                    }}
                    className="form-check"
                  >
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={certificateSelected === c.key}
                      readOnly
                      id={`cert_${i}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`cert_${i}`}
                      onClick={() => {
                        setCertificateSelected((prev) =>
                          prev === c.key ? "" : c.key
                        );
                      }}
                    >
                      {c.label}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Instructors Filter */}
        <div className="courses-widget">
          <h4 className="widget-title">Instructors</h4>
          <div className="courses-cat-list">
            <ul className="list-wrap">
              {instructorsToShow.map((instructor: any, i: any) => (
                <li key={i}>
                  <div
                    onClick={() => {
                      if (instructor === "All Instructors") {
                        return setInstructorSelected("");
                      }
                      setInstructorSelected((prev) =>
                        prev === instructor ? "" : instructor
                      );
                    }}
                    className="form-check"
                  >
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={
                        instructor === "All Instructors"
                          ? instructorSelected === ""
                          : instructor === instructorSelected
                      }
                      readOnly
                      id={`instructor_${i}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`instructor_${i}`}
                      onClick={() => {
                        if (instructor === "All Instructors") {
                          return setInstructorSelected("");
                        }
                        setInstructorSelected((prev) =>
                          prev === instructor ? "" : instructor
                        );
                      }}
                    >
                      {instructor}
                    </label>
                  </div>
                </li>
              ))}
            </ul>
            <div className="show-more">
              <a
                className={`show-more-btn ${
                  showMoreInstructor ? "active" : ""
                }`}
                style={{ cursor: "pointer" }}
                onClick={() => setShowMoreInstructor(!showMoreInstructor)}
              >
                {showMoreInstructor ? "Show Less -" : "Show More +"}
              </a>
            </div>
          </div>
        </div>

        {/* Rating Filter */}
        <div className="courses-widget">
          <h4 className="widget-title">Ratings</h4>
          <div className="courses-rating-list">
            <ul className="list-wrap">
              {[5, 4, 3, 2, 1].map((rating, i) => (
                <li key={i}>
                  <div
                    onClick={() => {
                      setRatingSelected((prev) =>
                        prev === rating ? null : rating
                      );
                    }}
                    className="form-check"
                  >
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={rating === ratingSelected}
                      readOnly
                      id={`rating_${i}`}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`rating_${i}`}
                      onClick={() => {
                        setRatingSelected((prev) =>
                          prev === rating ? null : rating
                        );
                      }}
                    >
                      <div className="rating">
                        <Rating initialValue={rating} size={20} readonly />
                      </div>
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default CourseSidebar;
