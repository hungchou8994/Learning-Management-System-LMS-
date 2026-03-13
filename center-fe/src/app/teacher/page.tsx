"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deleteAuthUser,
  listAuthUsers,
  getUserProfilesByUsernames,
  updateAuthUser,
  updateUserInformationByUsername,
  listTeacherApplications,
  createTeacherApplicationDraft,
  updateTeacherApplicationStatus,
  updateTeacherApplicationDetails,
  type AuthUser,
  type TeacherApplication,
} from "@/lib/api";
import { useRoleGuard } from "@/lib/useRoleGuard";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Tab = "teachers" | "applications";

export default function TeacherPage() {
  const { loading: authLoading, role } = useRoleGuard([
    "admin",
    "manager",
    "recruiter",
  ]);
  const [tab, setTab] = useState<Tab>("teachers");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [teachers, setTeachers] = useState<AuthUser[]>([]);
  const [applications, setApplications] = useState<TeacherApplication[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForms, setEditForms] = useState<
    Record<
      string,
      {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email: string;
      }
    >
  >({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const canDelete = role === "manager" || role === "admin";
  const canEditProfile = role === "manager" || role === "admin";
  const canEditAuth = role === "admin";
  const gatewayBaseUrl =
    process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:3000";

  const fileUrl = (filename?: string) =>
    filename ? `${gatewayBaseUrl}/elearn/uploads/${filename}` : null;

  const getAppStatus = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      draft: { label: "Hồ sơ trống", cls: "badge bg-slate-600 text-white" },
      pending: { label: "Chờ duyệt", cls: "badge badge-primary" },
      approved: { label: "Đã duyệt", cls: "badge bg-green-600 text-white" },
      rejected: { label: "Đã từ chối", cls: "badge bg-gray-600 text-white" },
    };
    return map[s] || { label: s, cls: "badge bg-gray-600 text-white" };
  };

  const statusOrder = (s: string) => {
    // Required order: pending -> approved -> rejected (draft last if any)
    if (s === "pending") return 0;
    if (s === "approved") return 1;
    if (s === "rejected") return 2;
    return 3;
  };

  const sortedApplications = useMemo(() => {
    const next = [...applications];
    next.sort((a, b) => {
      const ao = statusOrder(a.status);
      const bo = statusOrder(b.status);
      if (ao !== bo) return ao - bo;
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return bt - at;
    });
    return next;
  }, [applications]);

  const applicationsByEmail = useMemo(() => {
    const map = new Map<string, TeacherApplication>();
    for (const a of applications) {
      const key = (a.email || "").toLowerCase().trim();
      if (!key) continue;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, a);
        continue;
      }
      const prevTime = new Date(prev.createdAt).getTime();
      const nextTime = new Date(a.createdAt).getTime();
      if (nextTime >= prevTime) map.set(key, a);
    }
    return map;
  }, [applications]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailApp, setDetailApp] = useState<TeacherApplication | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailForm, setDetailForm] = useState<{
    fullName: string;
    dob: string;
    address: string;
    email: string;
    phoneNumber: string;
    status: "pending" | "approved" | "rejected" | "draft";
    idCardFront: File | null;
    idCardBack: File | null;
    cv: File | null;
  }>({
    fullName: "",
    dob: "",
    address: "",
    email: "",
    phoneNumber: "",
    status: "pending",
    idCardFront: null,
    idCardBack: null,
    cv: null,
  });

  const openDetail = (app: TeacherApplication) => {
    setDetailError("");
    setDetailApp(app);
    setDetailForm({
      fullName: app.fullName || "",
      dob: app.dob ? new Date(app.dob).toISOString().slice(0, 10) : "",
      address: app.address || "",
      email: app.email || "",
      phoneNumber: app.phoneNumber || "",
      status:
        (app.status as "pending" | "approved" | "rejected" | "draft") ||
        "pending",
      idCardFront: null,
      idCardBack: null,
      cv: null,
    });
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailApp(null);
    setDetailError("");
  };

  const getRoleLabel = (r: string) => {
    const labels: Record<string, string> = {
      admin: "Quản trị viên",
      manager: "Quản lý",
      recruiter: "Nhân sự",
      accountant: "Kế toán",
      teacher: "Giáo viên",
      student: "Học sinh",
      parent: "Phụ huynh",
    };
    return labels[r] || r;
  };

  const getRoleColor = (r: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800 border-red-200",
      manager: "bg-blue-100 text-blue-800 border-blue-200",
      recruiter: "bg-green-100 text-green-800 border-green-200",
      accountant: "bg-purple-100 text-purple-800 border-purple-200",
      teacher: "bg-amber-100 text-amber-800 border-amber-200",
      student: "bg-gray-100 text-gray-800 border-gray-200",
      parent: "bg-slate-100 text-slate-800 border-slate-200",
    };
    return colors[r] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const refreshTeachers = async () => {
    const res = await listAuthUsers({ role: "teacher" });
    if (!res.success || !res.data) {
      throw new Error(
        res.error?.message || "Không thể tải danh sách giáo viên."
      );
    }

    const usernames = res.data.map((u) => u.username);
    const profilesRes = await getUserProfilesByUsernames(usernames);
    const profileMap = new Map<
      string,
      {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        avatarUrl?: string;
      }
    >();
    if (profilesRes.success && profilesRes.data) {
      for (const p of profilesRes.data) {
        if (p.username) {
          profileMap.set(p.username, {
            firstName: p.firstName,
            lastName: p.lastName,
            phoneNumber: p.phoneNumber,
            avatarUrl: p.avatarUrl,
          });
        }
      }
    }

    setTeachers(
      res.data.map((u) => {
        const p = profileMap.get(u.username);
        return {
          ...u,
          firstName: p?.firstName ?? null,
          lastName: p?.lastName ?? null,
          phoneNumber: p?.phoneNumber ?? null,
          avatarUrl: p?.avatarUrl ?? null,
        };
      })
    );
  };

  const refreshApplications = async () => {
    const res = await listTeacherApplications();
    if (!res.success || !res.data) {
      throw new Error(
        res.error?.message || "Không thể tải danh sách ứng tuyển."
      );
    }
    setApplications(res.data);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        await Promise.all([refreshTeachers(), refreshApplications()]);
      } catch (e: unknown) {
        setError(
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message?: unknown }).message)
            : "Không thể tải dữ liệu."
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pendingCount = useMemo(
    () => applications.filter((a) => a.status === "pending").length,
    [applications]
  );

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      const res = await deleteAuthUser(deleteTarget.id);
      if (!res.success) throw new Error(res.error?.message || "Xóa thất bại");
      setDeleteTarget(null);
      await refreshTeachers();
    } catch (e: unknown) {
      setError(
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Không thể xóa tài khoản."
      );
    } finally {
      setDeleting(false);
    }
  };

  const onEdit = (user: AuthUser) => {
    if (!canEditProfile && !canEditAuth) return;
    setEditingUserId(user.id);
    setEditForms({
      ...editForms,
      [user.id]: {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
      },
    });
  };

  const onCancelEdit = (userId: string) => {
    setEditingUserId(null);
    const next = { ...editForms };
    delete next[userId];
    setEditForms(next);
  };

  const onSaveEdit = async (user: AuthUser) => {
    const formData = editForms[user.id];
    if (!formData) return;

    setSavingUserId(user.id);
    setError("");
    try {
      const ops: Promise<unknown>[] = [];

      if (canEditAuth) {
        const nextEmail = formData.email.trim();
        if (nextEmail && nextEmail !== user.email) {
          ops.push(updateAuthUser(user.id, { email: nextEmail }));
        }
      }

      if (canEditProfile) {
        ops.push(
          updateUserInformationByUsername(user.username, {
            firstName: formData.firstName.trim() || undefined,
            lastName: formData.lastName.trim() || undefined,
            phoneNumber: formData.phoneNumber.trim() || undefined,
          })
        );
      }

      const results = await Promise.all(ops);
      const fail = results.find(
        (r) =>
          typeof r === "object" &&
          r !== null &&
          "success" in r &&
          (r as { success?: boolean }).success === false
      ) as { error?: { message?: string } } | undefined;
      if (fail) throw new Error(fail.error?.message || "Cập nhật thất bại");

      setEditingUserId(null);
      const next = { ...editForms };
      delete next[user.id];
      setEditForms(next);
      await refreshTeachers();
    } catch (e: unknown) {
      setError(
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Không thể cập nhật thông tin."
      );
    } finally {
      setSavingUserId(null);
    }
  };

  // const onUpdateApp = async (id: string, status: "approved" | "rejected") => {
  //   setError("");
  //   const prev = applications;
  //   setApplications((p) => p.map((a) => (a._id === id ? { ...a, status } : a)));
  //   const res = await updateTeacherApplicationStatus(id, status);
  //   if (!res.success) {
  //     setApplications(prev);
  //     setError(res.error?.message || "Không thể cập nhật đơn ứng tuyển.");
  //     return;
  //   }
  //   await refreshApplications();
  // };

  const onEnsureTeacherDossier = async (teacher: AuthUser) => {
    setError("");
    const emailKey = (teacher.email || "").toLowerCase().trim();
    if (!emailKey) {
      setError("Giáo viên này chưa có email. Không thể tạo hồ sơ.");
      return;
    }
    const existing = applicationsByEmail.get(emailKey);
    if (existing) {
      openDetail(existing);
      return;
    }

    const fullName =
      [teacher.firstName, teacher.lastName].filter(Boolean).join(" ").trim() ||
      teacher.username;
    const res = await createTeacherApplicationDraft({
      email: emailKey,
      fullName,
    });
    if (!res.success || !res.data) {
      setError(res.error?.message || "Không thể tạo hồ sơ trống.");
      return;
    }
    await refreshApplications();
    openDetail(res.data);
  };

  const onSaveDetail = async () => {
    if (!detailApp) return;
    setDetailError("");
    setDetailSaving(true);
    try {
      // Allow changing status from detail view
      const nextStatus = detailForm.status;
      if (nextStatus && nextStatus !== detailApp.status) {
        const sres = await updateTeacherApplicationStatus(
          detailApp._id,
          nextStatus
        );
        if (!sres.success || !sres.data) {
          setDetailError(
            sres.error?.message || "Không thể cập nhật trạng thái."
          );
          return;
        }
        setDetailApp(sres.data);
      }

      const res = await updateTeacherApplicationDetails(detailApp._id, {
        fullName: detailForm.fullName,
        dob: detailForm.dob,
        address: detailForm.address,
        email: detailForm.email,
        phoneNumber: detailForm.phoneNumber,
        idCardFront: detailForm.idCardFront,
        idCardBack: detailForm.idCardBack,
        cv: detailForm.cv,
      });
      if (!res.success || !res.data) {
        setDetailError(res.error?.message || "Không thể lưu hồ sơ.");
        return;
      }
      setDetailApp(res.data);
      // clear selected files after upload
      setDetailForm((p) => ({
        ...p,
        idCardFront: null,
        idCardBack: null,
        cv: null,
      }));
      await refreshApplications();
    } finally {
      setDetailSaving(false);
    }
  };

  const FilePicker = (props: {
    label: string;
    accept: string;
    file: File | null;
    onPick: (file: File | null) => void;
    hint?: string;
    buttonText?: string;
  }) => {
    const { label, accept, file, onPick, hint, buttonText } = props;
    return (
      <div>
        {label ? <label className="label">{label}</label> : null}
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
            <input
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0] || null)}
            />
            {buttonText || "Chọn tệp"}
          </label>
          <div className="text-sm text-gray-700 truncate flex-1 min-w-0">
            {file ? file.name : "Chưa chọn tệp"}
          </div>
        </div>
        {hint ? <div className="text-xs text-gray-500 mt-1">{hint}</div> : null}
      </div>
    );
  };

  if (authLoading || loading) {
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
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Quản lý giáo viên
        </h1>
        <p className="text-gray-600">
          Duyệt hồ sơ ứng tuyển, cập nhật trạng thái, và quản lý danh sách giáo
          viên một cách rõ ràng – nhanh – chuẩn.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              className={
                tab === "teachers" ? "btn btn-primary" : "btn btn-ghost"
              }
              onClick={() => setTab("teachers")}
            >
              Giáo viên
            </button>
            <button
              type="button"
              className={
                tab === "applications" ? "btn btn-primary" : "btn btn-ghost"
              }
              onClick={() => setTab("applications")}
            >
              Ứng tuyển{" "}
              {pendingCount > 0 && (
                <span className="ml-2 badge badge-primary">{pendingCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-5">
          {tab === "teachers" ? (
            <div className="overflow-x-auto border rounded-2xl">
              <table className="min-w-[1000px] w-full text-sm table-fixed">
                <colgroup>
                  <col style={{ width: "200px" }} />
                  <col style={{ width: "160px" }} />
                  <col style={{ width: "200px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "150px" }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border-b">Họ và tên</th>
                    <th className="text-left p-3 border-b">Username</th>
                    <th className="text-left p-3 border-b">Email</th>
                    <th className="text-left p-3 border-b">Role</th>
                    <th className="text-left p-3 border-b">Số điện thoại</th>
                    <th className="text-left p-3 border-b">Ngày tạo</th>
                    <th className="text-left p-3 border-b">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => {
                    const isEditing = editingUserId === t.id;
                    const formData = editForms[t.id] || {
                      firstName: t.firstName || "",
                      lastName: t.lastName || "",
                      phoneNumber: t.phoneNumber || "",
                      email: t.email || "",
                    };
                    const fullName = [t.firstName, t.lastName]
                      .filter(Boolean)
                      .join(" ")
                      .trim();
                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3 border-b">
                          <div className="h-10 flex items-center">
                            {isEditing ? (
                              <div className="flex w-full gap-2">
                                <input
                                  type="text"
                                  value={formData.firstName}
                                  onChange={(e) =>
                                    setEditForms({
                                      ...editForms,
                                      [t.id]: {
                                        ...formData,
                                        firstName: e.target.value,
                                      },
                                    })
                                  }
                                  className="flex-1 min-w-0 h-9 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Họ"
                                />
                                <input
                                  type="text"
                                  value={formData.lastName}
                                  onChange={(e) =>
                                    setEditForms({
                                      ...editForms,
                                      [t.id]: {
                                        ...formData,
                                        lastName: e.target.value,
                                      },
                                    })
                                  }
                                  className="flex-1 min-w-0 h-9 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Tên"
                                />
                              </div>
                            ) : fullName ? (
                              <div className="font-semibold text-gray-900 truncate">
                                {fullName}
                              </div>
                            ) : (
                              <div className="text-gray-400 italic text-xs truncate">
                                Chưa cập nhật
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-3 border-b">
                          <div className="h-10 flex items-center">
                            {isEditing ? (
                              <input
                                type="text"
                                value={t.username}
                                disabled
                                className="w-full h-9 px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-600"
                                title="Không hỗ trợ đổi username (ảnh hưởng dữ liệu liên kết)."
                              />
                            ) : (
                              <div className="font-medium text-gray-700 truncate">
                                {t.username}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-3 border-b">
                          <div className="h-10 flex items-center">
                            {isEditing ? (
                              <input
                                type="email"
                                value={formData.email}
                                disabled={!canEditAuth}
                                onChange={(e) =>
                                  setEditForms({
                                    ...editForms,
                                    [t.id]: {
                                      ...formData,
                                      email: e.target.value,
                                    },
                                  })
                                }
                                className={`w-full h-9 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  canEditAuth
                                    ? "border-gray-300 bg-white"
                                    : "border-gray-200 bg-gray-50 text-gray-600"
                                }`}
                                placeholder="Email"
                                title={
                                  canEditAuth
                                    ? ""
                                    : "Chỉ admin có quyền sửa email."
                                }
                              />
                            ) : (
                              <div className="text-gray-700 truncate">
                                {t.email}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-3 border-b">
                          <div className="h-10 flex items-center">
                            <span
                              className={`badge border ${getRoleColor(
                                "teacher"
                              )}`}
                              title="Giáo viên"
                            >
                              {getRoleLabel("teacher")}
                            </span>
                          </div>
                        </td>

                        <td className="p-3 border-b">
                          <div className="h-10 flex items-center">
                            {isEditing ? (
                              <input
                                type="tel"
                                value={formData.phoneNumber}
                                disabled={!canEditProfile}
                                onChange={(e) =>
                                  setEditForms({
                                    ...editForms,
                                    [t.id]: {
                                      ...formData,
                                      phoneNumber: e.target.value,
                                    },
                                  })
                                }
                                className={`w-full h-9 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  canEditProfile
                                    ? "border-gray-300 bg-white"
                                    : "border-gray-200 bg-gray-50 text-gray-600"
                                }`}
                                placeholder="Số điện thoại"
                                title={
                                  canEditProfile
                                    ? ""
                                    : "Bạn không có quyền sửa profile."
                                }
                              />
                            ) : t.phoneNumber ? (
                              <div className="text-gray-700 truncate">
                                {t.phoneNumber}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-xs">-</div>
                            )}
                          </div>
                        </td>

                        <td className="p-3 border-b">
                          <div className="h-10 flex items-center">
                            <div className="text-xs text-gray-600">
                              {t.createdAt
                                ? new Date(t.createdAt).toLocaleDateString(
                                    "vi-VN",
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    }
                                  )
                                : "-"}
                            </div>
                          </div>
                        </td>

                        <td className="p-3 border-b">
                          <div className="h-10 flex items-center">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="btn bg-green-600 text-white hover:bg-green-700 text-xs px-3 py-1.5 w-[60px] justify-center"
                                  onClick={() => onSaveEdit(t)}
                                  disabled={savingUserId === t.id}
                                >
                                  {savingUserId === t.id ? "..." : "Lưu"}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost text-xs px-3 py-1.5 w-[60px] justify-center"
                                  onClick={() => onCancelEdit(t.id)}
                                  disabled={savingUserId === t.id}
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {canEditProfile || canEditAuth ? (
                                  <button
                                    type="button"
                                    className="btn bg-blue-600 text-white hover:bg-blue-700 text-xs px-3 py-1.5 w-[60px] justify-center"
                                    onClick={() => onEdit(t)}
                                  >
                                    Sửa
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    Không có quyền sửa
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-ghost text-xs px-3 py-1.5"
                                  onClick={() => onEnsureTeacherDossier(t)}
                                  title="Xem / tạo hồ sơ ứng tuyển"
                                >
                                  Hồ sơ
                                </button>
                                {canDelete ? (
                                  <button
                                    type="button"
                                    className="btn bg-red-600 text-white hover:bg-red-700 text-xs px-3 py-1.5 w-[60px] justify-center"
                                    onClick={() => setDeleteTarget(t)}
                                  >
                                    Xóa
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-500">
                                    Không có quyền xóa
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {teachers.length === 0 && (
                    <tr>
                      <td className="p-3 text-gray-600" colSpan={7}>
                        Chưa có giáo viên nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-2xl">
              <table className="min-w-[1100px] w-full text-sm table-fixed">
                <colgroup>
                  <col style={{ width: "240px" }} />
                  <col style={{ width: "240px" }} />
                  <col style={{ width: "180px" }} />
                  <col style={{ width: "220px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "220px" }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border-b">Họ và tên</th>
                    <th className="text-left p-3 border-b">Email</th>
                    <th className="text-left p-3 border-b">Số điện thoại</th>
                    <th className="text-left p-3 border-b">Ngày tạo</th>
                    <th className="text-left p-3 border-b">Trạng thái</th>
                    <th className="text-center p-3 border-b">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedApplications.map((a) => {
                    const st = getAppStatus(a.status);
                    return (
                      <tr
                        key={a._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3 border-b">
                          <button
                            type="button"
                            className="text-left"
                            onClick={() => openDetail(a)}
                          >
                            <div className="font-semibold text-gray-900 truncate">
                              {a.fullName || "Chưa có tên"}
                            </div>
                            {a.dob ? (
                              <div className="text-xs text-gray-600 mt-1">
                                Ngày sinh:{" "}
                                {new Date(a.dob).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                })}
                              </div>
                            ) : null}
                          </button>
                        </td>
                        <td className="p-3 border-b">
                          <div className="text-gray-800 truncate">
                            {a.email}
                          </div>
                          {a.address ? (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              Đ/c: {a.address}
                            </div>
                          ) : null}
                        </td>
                        <td className="p-3 border-b">
                          <div className="text-gray-800">
                            {a.phoneNumber || "-"}
                          </div>
                        </td>
                        <td className="p-3 border-b">
                          <div className="text-xs text-gray-700">
                            {new Date(a.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </td>
                        <td className="p-3 border-b">
                          <span className={st.cls}>{st.label}</span>
                        </td>
                        <td className="p-3 border-b">
                          <div className="flex items-center gap-2 justify-center">
                            <button
                              type="button"
                              className="btn bg-blue-600 text-white hover:bg-blue-700 text-xs px-3 py-1.5"
                              onClick={() => openDetail(a)}
                            >
                              Chi tiết
                            </button>
                            {/* <button
                              type="button"
                              className="btn bg-green-600 text-white hover:bg-green-700 text-xs px-3 py-1.5 disabled:opacity-50"
                              onClick={() => onUpdateApp(a._id, "approved")}
                              disabled={a.status === "approved"}
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              className="btn bg-gray-700 text-white hover:bg-gray-800 text-xs px-3 py-1.5 disabled:opacity-50"
                              onClick={() => onUpdateApp(a._id, "rejected")}
                              disabled={a.status === "rejected"}
                            >
                              Từ chối
                            </button> */}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedApplications.length === 0 && (
                    <tr>
                      <td className="p-3 text-gray-600" colSpan={6}>
                        Chưa có hồ sơ ứng tuyển.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa tài khoản giáo viên?"
        description={
          deleteTarget
            ? `Bạn sắp xóa tài khoản "${deleteTarget.username}" (${deleteTarget.email}). Thao tác này không thể hoàn tác.`
            : ""
        }
        confirmText="Xóa"
        confirmVariant="danger"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
      />

      {detailOpen && detailApp ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDetail();
          }}
        >
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Hồ sơ ứng tuyển
                </div>
                <div className="text-sm text-gray-600">
                  {detailApp.email} •{" "}
                  <span className={getAppStatus(detailApp.status).cls}>
                    {getAppStatus(detailApp.status).label}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeDetail}
              >
                Đóng
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="label">Trạng thái</label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["pending", "approved", "rejected", "draft"] as const
                    ).map((s) => {
                      const meta = getAppStatus(s);
                      const active = detailForm.status === s;
                      const colors: Record<
                        string,
                        { bg: string; text: string; border: string }
                      > = {
                        pending: {
                          bg: "bg-blue-600",
                          text: "text-white",
                          border: "border-blue-600",
                        },
                        approved: {
                          bg: "bg-green-600",
                          text: "text-white",
                          border: "border-green-600",
                        },
                        rejected: {
                          bg: "bg-gray-700",
                          text: "text-white",
                          border: "border-gray-700",
                        },
                        draft: {
                          bg: "bg-slate-600",
                          text: "text-white",
                          border: "border-slate-600",
                        },
                      };
                      const c = colors[s] || {
                        bg: "bg-gray-100",
                        text: "text-gray-700",
                        border: "border-gray-200",
                      };
                      return (
                        <button
                          key={s}
                          type="button"
                          className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                            active
                              ? `${c.bg} ${c.text} ${c.border}`
                              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() =>
                            setDetailForm((p) => ({ ...p, status: s }))
                          }
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Họ và tên</label>
                    <input
                      className="input"
                      value={detailForm.fullName}
                      onChange={(e) =>
                        setDetailForm((p) => ({
                          ...p,
                          fullName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Ngày sinh</label>
                    <input
                      type="date"
                      className="input"
                      value={detailForm.dob}
                      onChange={(e) =>
                        setDetailForm((p) => ({ ...p, dob: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Địa chỉ</label>
                  <input
                    className="input"
                    value={detailForm.address}
                    onChange={(e) =>
                      setDetailForm((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email</label>
                    <input
                      className="input"
                      value={detailForm.email}
                      onChange={(e) =>
                        setDetailForm((p) => ({ ...p, email: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label">Số điện thoại</label>
                    <input
                      className="input"
                      value={detailForm.phoneNumber}
                      onChange={(e) =>
                        setDetailForm((p) => ({
                          ...p,
                          phoneNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">CCCD mặt trước (ảnh)</label>
                    {detailApp.idCardFrontFile ? (
                      <div className="text-sm">
                        <a
                          href={fileUrl(detailApp.idCardFrontFile) || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Tải xuống / xem ảnh
                        </a>
                      </div>
                    ) : null}
                    <div className={detailApp.idCardFrontFile ? "mt-2" : ""}>
                      <FilePicker
                        label=""
                        accept="image/*"
                        file={detailForm.idCardFront}
                        onPick={(f) =>
                          setDetailForm((p) => ({ ...p, idCardFront: f }))
                        }
                        buttonText={
                          detailApp.idCardFrontFile
                            ? "Thay thế ảnh"
                            : "Chọn ảnh"
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">CCCD mặt sau (ảnh)</label>
                    {detailApp.idCardBackFile ? (
                      <div className="text-sm">
                        <a
                          href={fileUrl(detailApp.idCardBackFile) || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Tải xuống / xem ảnh
                        </a>
                      </div>
                    ) : null}
                    <div className={detailApp.idCardBackFile ? "mt-2" : ""}>
                      <FilePicker
                        label=""
                        accept="image/*"
                        file={detailForm.idCardBack}
                        onPick={(f) =>
                          setDetailForm((p) => ({ ...p, idCardBack: f }))
                        }
                        buttonText={
                          detailApp.idCardBackFile ? "Thay thế ảnh" : "Chọn ảnh"
                        }
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="label">CV (PDF)</label>
                  {detailApp.cvFile ? (
                    <div className="text-sm">
                      <a
                        href={fileUrl(detailApp.cvFile) || "#"}
                        download
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Tải xuống CV
                      </a>
                    </div>
                  ) : null}
                  <div className={detailApp.cvFile ? "mt-2" : ""}>
                    <FilePicker
                      label=""
                      accept="application/pdf"
                      file={detailForm.cv}
                      onPick={(f) => setDetailForm((p) => ({ ...p, cv: f }))}
                      buttonText={
                        detailApp.cvFile ? "Thay thế file PDF" : "Chọn file PDF"
                      }
                    />
                  </div>
                </div>

                {detailError ? (
                  <div className="alert alert-error">{detailError}</div>
                ) : null}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={closeDetail}
                    disabled={detailSaving}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onSaveDetail}
                    disabled={detailSaving}
                  >
                    {detailSaving ? "Đang lưu..." : "Lưu hồ sơ"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
