import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

interface ReviewUser {
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

interface Review {
  _id: string;
  rate: number;
  comment: string;
  title: string;
  date?: string;
  createdAt?: string;
  userId: ReviewUser;
}

function resolveAvatarSrc(apiBase: string | undefined, raw?: string | null) {
  const url = String(raw || "").trim();

  // Only fall back when truly empty
  if (!url) return "/assets/img/avatar-default.png";

  // Absolute URLs can be used as-is
  if (url.startsWith("http://") || url.startsWith("https://")) return url;

  // Stored as "/uploads/xxx" in elearn-db -> serve via gateway "/elearn/uploads/xxx"
  if (url.startsWith("/uploads/")) {
    return apiBase ? `${apiBase}/elearn${url}` : url;
  }

  // Any other absolute-ish path (rare): try gateway prefix so it still works
  if (url.startsWith("/")) {
    return apiBase ? `${apiBase}${url}` : url;
  }

  // Bare filename fallback
  return apiBase ? `${apiBase}/elearn/uploads/${url}` : `/uploads/${url}`;
}

interface ReviewsProps {
  courseId: string;
  isEnrolled: boolean;
  initialFeedback: Review[];
}

function clampRate(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(1, Math.min(5, Math.round(n)));
}

const Reviews = ({ courseId, isEnrolled, initialFeedback }: ReviewsProps) => {
  const [feedback, setFeedback] = useState<Review[]>(initialFeedback || []);
  const [rate, setRate] = useState<number>(0);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const apiBase = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  const ratingDistribution = useMemo(() => {
    const dist = Array(5).fill(0);
    feedback.forEach((review) => {
      const r = clampRate(Number(review.rate));
      if (r >= 1 && r <= 5) dist[r - 1] += 1;
    });
    return dist;
  }, [feedback]);

  const totalReviews = feedback.length;
  const averageRating =
    totalReviews > 0
      ? feedback.reduce((acc, review) => acc + Number(review.rate || 0), 0) /
        totalReviews
      : 0;

  const sortedFeedback = useMemo(
    () => [...feedback].sort((a, b) => Number(b.rate) - Number(a.rate)),
    [feedback]
  );

  const loadFeedback = async () => {
    try {
      if (!apiBase) return;
      const resp = await fetch(
        `${apiBase}/api/elearn/feedback/course/${courseId}`,
        {
          cache: "no-store",
        }
      );
      const data = await resp.json().catch(() => null);
      if (resp.ok && data?.status === "success" && Array.isArray(data?.data)) {
        setFeedback(data.data as Review[]);
      }
    } catch {
      // Ignore: keep existing feedback
    }
  };

  useEffect(() => {
    // Refresh list once on mount to stay in sync with latest backend data
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const onSubmit = async () => {
    if (!apiBase) return;
    setError("");
    setSuccess("");

    const r = clampRate(rate);
    if (r < 1 || r > 5) {
      setError("Bạn hãy chọn số sao (1–5).");
      return;
    }
    if (!title.trim()) {
      setError("Bạn hãy nhập tiêu đề review.");
      return;
    }

    setBusy(true);
    try {
      const resp = await fetch(
        `${apiBase}/api/elearn/feedback/course/${courseId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            rate: r,
            title: title.trim(),
            comment: comment.trim(),
          }),
        }
      );
      const data = await resp.json().catch(() => null);
      if (!resp.ok || data?.status !== "success") {
        throw new Error(data?.message || "Không thể gửi review.");
      }

      setSuccess("Đã lưu review của bạn.");
      setRate(0);
      setTitle("");
      setComment("");
      await loadFeedback();
    } catch (e: unknown) {
      setError(
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Không thể gửi review."
      );
    } finally {
      setBusy(false);
    }
  };

  // Calculate rating distribution
  return (
    <div className="courses__rating-wrap" style={{ paddingBottom: "40px" }}>
      <div className="course-rate" style={{ marginBottom: "40px" }}>
        <div className="course-rate__summary">
          <div className="course-rate__summary-value">
            {averageRating.toFixed(1)}
          </div>
          <div className="course-rate__summary-stars">
            {[...Array(5)].map((_, index) => (
              <i
                key={index}
                className={`fas fa-star${
                  index < averageRating ? "" : " text-gray-300"
                }`}
                style={{
                  color: index < averageRating ? "#F8BC24" : "#D1D5DB",
                }}
              />
            ))}
          </div>
          <div className="course-rate__summary-text">
            {totalReviews} Ratings
          </div>
        </div>
        <div className="course-rate__details">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="course-rate__details-row">
              <div
                className="course-rate__details-row-star"
                style={{ display: "flex", alignItems: "center" }}
              >
                <div style={{ width: "15px" }}>{stars}</div>
                <i className="fas fa-star" style={{ color: "#F8BC24" }}></i>
              </div>
              <div className="course-rate__details-row-value">
                <div className="rating-gray"></div>
                <div
                  className="rating"
                  style={{
                    width: `${
                      totalReviews > 0
                        ? (ratingDistribution[stars - 1] / totalReviews) * 100
                        : 0
                    }%`,
                  }}
                  title={`${
                    totalReviews > 0
                      ? (
                          (ratingDistribution[stars - 1] / totalReviews) *
                          100
                        ).toFixed(0)
                      : 0
                  }%`}
                ></div>
                <span className="rating-count">
                  {ratingDistribution[stars - 1]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isEnrolled ? (
        <div
          className="courses__details-content"
          style={{
            padding: "20px",
            border: "1px solid #e7effc",
            borderRadius: "20px",
            marginBottom: "30px",
            background: "#ffffff",
          }}
        >
          <h4 className="title" style={{ marginBottom: "12px" }}>
            Write your feedback
          </h4>

          {error && (
            <div style={{ color: "#b42318", marginBottom: "10px" }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ color: "#027a48", marginBottom: "10px" }}>
              {success}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontWeight: 600 }}>Rating:</span>
            <div>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRate(n)}
                  disabled={busy}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    marginRight: 6,
                    cursor: busy ? "not-allowed" : "pointer",
                  }}
                  aria-label={`Rate ${n} star`}
                >
                  <i
                    className="fas fa-star"
                    style={{ color: n <= rate ? "#F8BC24" : "#D1D5DB" }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}
          >
            <div>
              <label
                style={{ fontWeight: 600, display: "block", marginBottom: 6 }}
              >
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={busy}
                placeholder="Example: The course is very easy to understand"
                style={{
                  width: "100%",
                  border: "1px solid #e7effc",
                  borderRadius: 8,
                  padding: "10px 12px",
                }}
              />
            </div>
            <div>
              <label
                style={{ fontWeight: 600, display: "block", marginBottom: 6 }}
              >
                Content (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={busy}
                placeholder="What do you think of the course? What needs to be improved?"
                rows={4}
                style={{
                  width: "100%",
                  border: "1px solid #e7effc",
                  borderRadius: 8,
                  padding: "10px 12px",
                  resize: "vertical",
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn btn-two"
            onClick={onSubmit}
            disabled={busy}
            style={{ marginTop: 14 }}
          >
            {busy ? "Đang gửi..." : "Send review"}
          </button>
        </div>
      ) : (
        <p style={{ marginBottom: "20px", color: "#6b7280" }}>
          You need to enroll the course to be able to review and write a review.
        </p>
      )}

      {sortedFeedback.map((review) => (
        <div
          className="course-review-head courses__rating-wrap"
          key={review._id}
          style={{
            marginBottom: "0px",
            marginTop: "30px",
          }}
        >
          <div className="review-author-thumb">
            <Image
              src={resolveAvatarSrc(apiBase, review.userId?.avatarUrl)}
              width={120}
              height={120}
              alt={`${review.userId.firstName} ${review.userId.lastName}`}
              style={{
                borderRadius: "50%",
                boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
          <div
            className="review-author-content"
            style={{ flex: 1, minWidth: 0 }}
          >
            <div
              className="author-name"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h5 className="name">
                {review.userId.firstName} {review.userId.lastName}{" "}
                <span>
                  {new Date(
                    review.date || review.createdAt || Date.now()
                  ).toLocaleDateString()}
                </span>
              </h5>
              <div className="author-rating">
                {[...Array(5)].map((_, index) => (
                  <i
                    key={index}
                    className="fas fa-star"
                    style={{
                      color: index < review.rate ? "#F8BC24" : "#D1D5DB",
                    }}
                  />
                ))}
              </div>
            </div>
            <h4 className="title">{review.title}</h4>
            <p style={{ minHeight: "3em", wordBreak: "break-word" }}>
              {review.comment}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Reviews;
