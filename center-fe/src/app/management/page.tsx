"use client";

import { useState } from "react";
import {
  createTeacherApplicationDraft,
  listAuthUsers,
  listTeacherApplications,
  syncCoursesAggregates,
  updateUserInformationByUsername,
  type AuthUser,
  type TeacherApplication,
} from "@/lib/api";
import { useRoleGuard } from "@/lib/useRoleGuard";

function splitVietnameseName(fullName: string): {
  firstName?: string;
  lastName?: string;
} {
  const parts = fullName.trim().split(/\s+/g).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

export default function ManagementPage() {
  const { loading: authLoading } = useRoleGuard(["admin"]);
  const [busy, setBusy] = useState<null | "teachers" | "courses">(null);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string>("");

  const onSyncTeachers = async () => {
    setBusy("teachers");
    setError("");
    setLog("");
    try {
      const [teachersRes, appsRes] = await Promise.all([
        listAuthUsers({ role: "teacher" }),
        listTeacherApplications(),
      ]);
      if (!teachersRes.success || !teachersRes.data) {
        throw new Error(
          teachersRes.error?.message || "Không thể tải danh sách giáo viên."
        );
      }
      if (!appsRes.success || !appsRes.data) {
        throw new Error(
          appsRes.error?.message || "Không thể tải danh sách hồ sơ ứng tuyển."
        );
      }

      const teachers = teachersRes.data as AuthUser[];
      const apps = appsRes.data as TeacherApplication[];
      const appByEmail = new Map<string, TeacherApplication>();
      for (const a of apps) {
        const key = (a.email || "").toLowerCase().trim();
        if (!key) continue;
        const prev = appByEmail.get(key);
        if (!prev) {
          appByEmail.set(key, a);
          continue;
        }
        const prevT = new Date(prev.createdAt).getTime();
        const nextT = new Date(a.createdAt).getTime();
        if (nextT >= prevT) appByEmail.set(key, a);
      }

      let ensured = 0;
      let updatedProfile = 0;
      let skippedNoEmail = 0;

      for (const t of teachers) {
        const emailKey = (t.email || "").toLowerCase().trim();
        if (!emailKey) {
          skippedNoEmail += 1;
          continue;
        }

        let app = appByEmail.get(emailKey);
        if (!app) {
          const fullName =
            [t.firstName, t.lastName].filter(Boolean).join(" ").trim() ||
            t.username;
          const created = await createTeacherApplicationDraft({
            email: emailKey,
            fullName,
          });
          if (created.success && created.data) {
            ensured += 1;
            app = created.data;
            appByEmail.set(emailKey, app);
          }
        }

        // Sync teacher profile from application (mostly name/phone)
        if (app && (app.fullName || app.phoneNumber)) {
          const { firstName, lastName } = splitVietnameseName(
            app.fullName || ""
          );
          const up = await updateUserInformationByUsername(t.username, {
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phoneNumber: app.phoneNumber || undefined,
          });
          if (up.success) updatedProfile += 1;
        }
      }

      setLog(
        [
          `Đồng bộ giáo viên xong.`,
          `- Tổng giáo viên: ${teachers.length}`,
          `- Tạo hồ sơ trống cho giáo viên cũ: ${ensured}`,
          `- Cập nhật profile theo hồ sơ: ${updatedProfile}`,
          `- Bỏ qua (thiếu email): ${skippedNoEmail}`,
        ].join("\n")
      );
    } catch (e: unknown) {
      setError(
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Không thể đồng bộ giáo viên."
      );
    } finally {
      setBusy(null);
    }
  };

  const onSyncCourses = async () => {
    setBusy("courses");
    setError("");
    setLog("");
    try {
      const res = await syncCoursesAggregates();
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || "Không thể đồng bộ khóa học.");
      }
      setLog(
        [
          `Đồng bộ khóa học xong.`,
          `- Số khóa học cập nhật: ${res.data.courses}`,
          `- Thời gian: ${new Date(res.data.updatedAt).toLocaleString(
            "vi-VN"
          )}`,
        ].join("\n")
      );
    } catch (e: unknown) {
      setError(
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Không thể đồng bộ khóa học."
      );
    } finally {
      setBusy(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading-spinner h-14 w-14 mx-auto mb-4"></div>
          <div className="text-gray-600">Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-glass p-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Quản lý</h1>
        <p className="text-gray-600">
          Bộ công cụ dành cho Admin để đồng bộ dữ liệu, sửa sai lệch và giữ hệ thống luôn “khớp” giữa các dịch vụ.
        </p>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="card p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div>
            <div className="font-semibold text-gray-900">Đồng bộ dữ liệu</div>
            <div className="text-sm text-gray-600">
              Đồng bộ giáo viên theo hồ sơ ứng tuyển và đồng bộ số liệu khóa học
              (rating, số học sinh).
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSyncTeachers}
              disabled={busy !== null}
            >
              {busy === "teachers" ? "Đang đồng bộ..." : "Đồng bộ giáo viên"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onSyncCourses}
              disabled={busy !== null}
            >
              {busy === "courses" ? "Đang đồng bộ..." : "Đồng bộ khóa học"}
            </button>
          </div>
        </div>

        {log ? (
          <pre className="whitespace-pre-wrap text-sm bg-gray-50 border rounded-xl p-4 text-gray-800">
            {log}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
