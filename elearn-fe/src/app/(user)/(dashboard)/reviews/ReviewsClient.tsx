"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CourseLite = {
  _id: string;
  name: string;
  thumbnail?: string | null;
};

type MyFeedback = {
  _id: string;
  rate: number;
  title?: string | null;
  comment?: string | null;
  createdAt?: string;
  date?: string;
  courseId?: CourseLite | string;
};

function clampRate(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function formatDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN");
}

export default function ReviewsClient() {
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<MyFeedback[]>([]);

  const apiBase = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

  useEffect(() => {
    const run = async () => {
      setBusy(true);
      setError("");
      try {
        if (!apiBase) {
          setError("Missing NEXT_PUBLIC_API_GATEWAY_URL.");
          setRows([]);
          return;
        }
        const resp = await fetch(`${apiBase}/api/elearn/feedback/mine`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const data = await resp.json().catch(() => null);
        if (!resp.ok || data?.status !== "success" || !Array.isArray(data?.data)) {
          setError(data?.message || "Không thể tải danh sách review của bạn.");
          setRows([]);
          return;
        }
        setRows(data.data as MyFeedback[]);
      } catch (e: unknown) {
        setError(
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message?: unknown }).message)
            : "Lỗi kết nối."
        );
        setRows([]);
      } finally {
        setBusy(false);
      }
    };

    run();
  }, [apiBase]);

  const hasRows = rows.length > 0;

  const normalized = useMemo(() => {
    return rows.map((r) => {
      const course =
        r.courseId && typeof r.courseId === "object" ? (r.courseId as CourseLite) : null;
      const courseId = course?._id || (typeof r.courseId === "string" ? r.courseId : "");
      return {
        ...r,
        _course: course,
        _courseId: courseId,
        _rate: clampRate(Number(r.rate)),
        _date: formatDate(r.createdAt || r.date),
      };
    });
  }, [rows]);

  return (
    <div className="dashboard__content-wrap">
      <div className="dashboard__content-title">
        <h4 className="title">Reviews</h4>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-12">
          <div className="dashboard__review-table">
            <table className="table table-borderless">
              {(busy || hasRows) && (
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Feedback</th>
                    <th>Date</th>
                  </tr>
                </thead>
              )}
              <tbody>
                {busy ? (
                  <tr>
                    <td colSpan={3}>Đang tải...</td>
                  </tr>
                ) : !hasRows ? (
                  <tr>
                    <td colSpan={3}>
                      <p className="text-center">
                        No reviews yet. Start by enrolling in a course and leaving feedback!
                      </p>
                    </td>
                  </tr>
                ) : (
                  normalized.map((r) => (
                    <tr key={r._id}>
                      <td>
                        {r._courseId ? (
                          <Link href={`/courses/${r._courseId}`}>
                            {r._course?.name || "Course"}
                          </Link>
                        ) : (
                          <span>{r._course?.name || "Course"}</span>
                        )}
                      </td>
                      <td>
                        <div className="review__wrap">
                          <div className="rating">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i
                                key={i}
                                className={`fas fa-star ${i < r._rate ? "" : "text-muted"}`}
                              ></i>
                            ))}
                          </div>
                          <span>({r._rate}/5)</span>
                        </div>
                        {r.title ? <p className="mb-1">{r.title}</p> : null}
                        {r.comment ? <p className="mb-0">{r.comment}</p> : null}
                      </td>
                      <td>{r._date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


