"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Users,
} from "lucide-react";
import {
  getInstructorEnrolledStudents,
  type InstructorCourseStudentsGroup,
} from "@/lib/api";

function getInitial(name: string, username: string) {
  const n = String(name || "").trim();
  const u = String(username || "").trim();
  const ch = (n[0] || u[0] || "?").toUpperCase();
  return ch;
}

function StudentAvatar({
  name,
  username,
  src,
}: {
  name: string;
  username: string;
  src?: string;
}) {
  const [broken, setBroken] = useState(false);
  const initial = getInitial(name, username);

  if (!src || broken) {
    return (
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-100 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-blue-700">{initial}</span>
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
      <Image
        src={src}
        alt={name}
        width={36}
        height={36}
        className="object-cover"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function statusBadge(status: "paid" | "not_paid") {
  return status === "paid" ? (
    <span className="badge badge-success">Đã thanh toán</span>
  ) : (
    <span className="badge badge-warning">Chưa thanh toán</span>
  );
}

export default function StudentsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState<InstructorCourseStudentsGroup[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const [view, setView] = useState<"by_course" | "all">("by_course");
  const [status, setStatus] = useState<"paid" | "not_paid" | "all">("paid");
  const [q, setQ] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      const res = await getInstructorEnrolledStudents({ status });
      if (res.success && res.data) {
        setGroups(res.data.courses || []);
      } else {
        setGroups([]);
        setError(res.error?.message || "Không thể tải danh sách học sinh.");
      }
      setIsLoading(false);
    };
    load();
  }, [status]);

  const filteredGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return groups;

    return groups
      .map((g) => {
        const courseMatch = g.course.name.toLowerCase().includes(needle);
        const students = g.students.filter((s) => {
          return (
            s.name.toLowerCase().includes(needle) ||
            s.username.toLowerCase().includes(needle) ||
            s.email.toLowerCase().includes(needle)
          );
        });
        if (courseMatch) return g;
        if (students.length === 0) return null;
        return { ...g, students, stats: { ...g.stats, total: students.length } };
      })
      .filter((x): x is InstructorCourseStudentsGroup => x !== null);
  }, [groups, q]);

  const allRows = useMemo(() => {
    const rows = groups.flatMap((g) =>
      g.students.map((s) => ({
        ...s,
        courseId: g.course._id,
        courseName: g.course.name,
        courseTag: g.course.tag,
      }))
    );

    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((r) => {
          return (
            r.name.toLowerCase().includes(needle) ||
            r.username.toLowerCase().includes(needle) ||
            r.email.toLowerCase().includes(needle) ||
            r.courseName.toLowerCase().includes(needle)
          );
        })
      : rows;

    return filtered.sort(
      (a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime()
    );
  }, [groups, q]);

  const totalStudents = useMemo(() => {
    if (view === "all") return allRows.length;
    return filteredGroups.reduce((sum, g) => sum + (g.students?.length || 0), 0);
  }, [allRows.length, filteredGroups, view]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading-spinner h-14 w-14 mx-auto mb-4"></div>
          <div className="text-gray-600">Đang tải danh sách học sinh...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-glass p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Học sinh đã enroll
            </h1>
            <p className="text-gray-600">
              Xem nhanh học sinh theo từng khóa học (view giáo viên).
            </p>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalStudents}
                </div>
                <div className="text-xs text-gray-500">học sinh</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              className="input pl-10"
              placeholder="Tìm theo tên học sinh / username / email / tên khóa học..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="input"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "paid" | "not_paid" | "all")
            }
          >
            <option value="paid">Chỉ đã thanh toán</option>
            <option value="not_paid">Chỉ chưa thanh toán</option>
            <option value="all">Tất cả</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="inline-flex bg-white border rounded-xl p-1 shadow-sm">
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === "by_course"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setView("by_course")}
            >
              Theo khóa học
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === "all"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setView("all")}
            >
              Tất cả học sinh
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle className="h-5 w-5" />
          {error}
          <button onClick={() => setError("")} className="ml-2">
            ✕
          </button>
        </div>
      )}

      {view === "by_course" && filteredGroups.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-gray-700 font-semibold mb-2">
            Chưa có dữ liệu học sinh
          </div>
          <div className="text-gray-600">
            Nếu bạn đã có học sinh enroll, hãy thử đổi bộ lọc trạng thái.
          </div>
          <div className="mt-6">
            <Link href="/courses" className="btn btn-primary">
              Quay lại khóa học
            </Link>
          </div>
        </div>
      ) : null}

      {view === "by_course" ? (
        <div className="space-y-4">
          {filteredGroups.map((g) => {
            const isOpen = !!open[g.course._id];
            return (
              <div key={g.course._id} className="card">
                <button
                  type="button"
                  className="w-full text-left card-content flex items-center justify-between gap-4"
                  onClick={() =>
                    setOpen((p) => ({ ...p, [g.course._id]: !p[g.course._id] }))
                  }
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {g.course.thumbnail ? (
                        <Image
                          src={g.course.thumbnail}
                          alt={g.course.name}
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/courses/${g.course._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-gray-900 truncate hover:underline underline-offset-4"
                          title={g.course.name}
                        >
                          {g.course.name}
                        </Link>
                        {g.course.tag ? (
                          <span className="badge badge-primary">{g.course.tag}</span>
                        ) : null}
                      </div>
                      <div className="text-sm text-gray-600">
                        {g.stats.total} học sinh
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="btn btn-ghost">
                      {isOpen ? (
                        <>
                          <ChevronUp className="h-4 w-4" />
                          Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Mở
                        </>
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t">
                    <div className="px-6 pb-6 pt-4">
                      <div className="overflow-x-auto">
                      <table className="min-w-[900px] w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left font-semibold text-gray-700 p-3 border-b">
                              Học sinh
                            </th>
                            <th className="text-left font-semibold text-gray-700 p-3 border-b">
                              Username
                            </th>
                            <th className="text-left font-semibold text-gray-700 p-3 border-b">
                              Email
                            </th>
                            <th className="text-left font-semibold text-gray-700 p-3 border-b">
                              Trạng thái
                            </th>
                            <th className="text-left font-semibold text-gray-700 p-3 border-b">
                              Tiến độ
                            </th>
                            <th className="text-left font-semibold text-gray-700 p-3 border-b">
                              Ngày enroll
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.students.map((s) => (
                            <tr key={s.enrollmentId} className="align-top">
                              <td className="p-3 border-b">
                                <div className="flex items-center gap-3">
                                  <StudentAvatar
                                    name={s.name}
                                    username={s.username}
                                    src={s.avatar}
                                  />
                                  <div className="font-medium text-gray-900">
                                    {s.name}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 border-b text-gray-700">
                                {s.username}
                              </td>
                              <td className="p-3 border-b text-gray-700">
                                {s.email}
                              </td>
                              <td className="p-3 border-b">{statusBadge(s.status)}</td>
                              <td className="p-3 border-b text-gray-700">
                                {Math.round(s.progress)}%
                              </td>
                              <td className="p-3 border-b text-gray-700">
                                {new Date(s.enrolledAt).toLocaleDateString("vi-VN")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "all" ? (
        allRows.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-gray-700 font-semibold mb-2">
              Chưa có dữ liệu học sinh
            </div>
            <div className="text-gray-600">
              Nếu bạn đã có học sinh enroll, hãy thử đổi bộ lọc trạng thái.
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-content">
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left font-semibold text-gray-700 p-3 border-b">
                        Học sinh
                      </th>
                      <th className="text-left font-semibold text-gray-700 p-3 border-b">
                        Khóa học
                      </th>
                      <th className="text-left font-semibold text-gray-700 p-3 border-b">
                        Email
                      </th>
                      <th className="text-left font-semibold text-gray-700 p-3 border-b">
                        Trạng thái
                      </th>
                      <th className="text-left font-semibold text-gray-700 p-3 border-b">
                        Tiến độ
                      </th>
                      <th className="text-left font-semibold text-gray-700 p-3 border-b">
                        Ngày enroll
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRows.map((r) => (
                      <tr key={r.enrollmentId} className="align-top">
                        <td className="p-3 border-b">
                          <div className="flex items-center gap-3">
                            <StudentAvatar
                              name={r.name}
                              username={r.username}
                              src={r.avatar}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {r.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {r.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 border-b">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/courses/${r.courseId}`}
                              className="font-medium text-gray-900 hover:underline underline-offset-4"
                            >
                              {r.courseName}
                            </Link>
                            {r.courseTag ? (
                              <span className="badge badge-primary">
                                {r.courseTag}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3 border-b text-gray-700">{r.email}</td>
                        <td className="p-3 border-b">{statusBadge(r.status)}</td>
                        <td className="p-3 border-b text-gray-700">
                          {Math.round(r.progress)}%
                        </td>
                        <td className="p-3 border-b text-gray-700">
                          {new Date(r.enrolledAt).toLocaleDateString("vi-VN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}


