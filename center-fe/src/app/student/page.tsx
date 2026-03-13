"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deleteAuthUser,
  getUserProfilesByUsernames,
  listAuthUsers,
  getStudentAnalyticsDetail,
  listStudentAnalytics,
  updateAuthUser,
  updateUserInformationByUsername,
  type StudentAnalyticsDetail,
  type StudentAnalyticsRow,
  type AuthUser,
} from "@/lib/api";
import { useRoleGuard } from "@/lib/useRoleGuard";
import { formatUsd } from "@/lib/money";
import { DetailDialog } from "@/components/analytics/DetailDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

type Tab = "analytics" | "accounts";

export default function StudentPage() {
  const { loading: authLoading, role } = useRoleGuard(["admin", "manager"]);
  const [tab, setTab] = useState<Tab>("analytics");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<StudentAnalyticsRow[]>([]);
  const [nameByUsername, setNameByUsername] = useState<Record<string, string>>(
    {}
  );

  const [fromYmd, setFromYmd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 365);
    return d.toISOString().slice(0, 10);
  });
  const [toYmd, setToYmd] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [q, setQ] = useState("");
  const [segment, setSegment] = useState<string>("");

  const [selected, setSelected] = useState<string | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detail, setDetail] = useState<StudentAnalyticsDetail | null>(null);

  // Accounts tab state
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accounts, setAccounts] = useState<AuthUser[]>([]);
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

  const canDelete = role === "admin" || role === "manager";
  const canEditProfile = role === "admin" || role === "manager";
  const canEditAuth = role === "admin";

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

  const rangeParams = useMemo(() => {
    const from = new Date(`${fromYmd}T00:00:00.000Z`).toISOString();
    const to = new Date(`${toYmd}T23:59:59.999Z`).toISOString();
    return { from, to };
  }, [fromYmd, toYmd]);

  const load = async () => {
    setBusy(true);
    setError("");
    const res = await listStudentAnalytics({
      ...rangeParams,
      q: q.trim() || undefined,
      segment: segment || undefined,
      limit: 500,
    });
    if (!res.success || !res.data) {
      setError(res.error?.message || "Không thể tải danh sách học sinh.");
      setRows([]);
      setNameByUsername({});
      setBusy(false);
      return;
    }

    // Đồng bộ nguồn: Analytics chỉ hiển thị user còn tồn tại trong auth-service (role=student)
    const authRes = await listAuthUsers({ role: "student" });
    const authSet = new Set<string>(
      (authRes.success && authRes.data ? authRes.data : []).map(
        (u) => u.username
      )
    );
    const nextRows = res.data.filter((r) => authSet.has(r.username));
    setRows(nextRows);

    // Map họ và tên theo username (lấy từ user profiles)
    const usernames = nextRows.map((r) => r.username).filter(Boolean);
    const profilesRes = await getUserProfilesByUsernames(usernames);
    const nextNameByUsername: Record<string, string> = {};
    if (profilesRes.success && profilesRes.data) {
      for (const p of profilesRes.data) {
        const u = String(p.username || "").trim();
        if (!u) continue;
        const fullName = [p.firstName, p.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (fullName) nextNameByUsername[u] = fullName;
      }
    }
    setNameByUsername(nextNameByUsername);
    setBusy(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccounts = async () => {
    setAccountsLoading(true);
    setError("");
    try {
      const res = await listAuthUsers({ role: "student" });
      if (!res.success || !res.data) {
        throw new Error(
          res.error?.message || "Không thể tải danh sách tài khoản học sinh."
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

      setAccounts(
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
    } catch (e: unknown) {
      setError(
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Không thể tải dữ liệu."
      );
      setAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "accounts") {
      loadAccounts();
    }
  }, [tab]);

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      const res = await deleteAuthUser(deleteTarget.id);
      if (!res.success) throw new Error(res.error?.message || "Xóa thất bại");
      setDeleteTarget(null);
      await loadAccounts();
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
      await loadAccounts();
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

  const openDetail = async (username: string) => {
    setSelected(username);
    setDetail(null);
    setDetailBusy(true);
    const res = await getStudentAnalyticsDetail(username, {
      ...rangeParams,
      limit: 100,
    });
    setDetail(res.success ? res.data || null : null);
    if (!res.success)
      setError(res.error?.message || "Không thể tải chi tiết học sinh.");
    setDetailBusy(false);
  };

  function segmentLabel(s: StudentAnalyticsRow["segment"] | string) {
    const v = String(s || "");
    if (v === "new_or_recent") return "Mới / gần đây";
    if (v === "active") return "Đang hoạt động";
    if (v === "at_risk") return "Nguy cơ rời bỏ";
    if (v === "churned") return "Đã rời bỏ";
    return "Chưa phân loại";
  }

  const segmentStats = useMemo(() => {
    const init = {
      unknown: { count: 0, revenue: 0 },
      new_or_recent: { count: 0, revenue: 0 },
      active: { count: 0, revenue: 0 },
      at_risk: { count: 0, revenue: 0 },
      churned: { count: 0, revenue: 0 },
    } as Record<
      StudentAnalyticsRow["segment"],
      { count: number; revenue: number }
    >;
    for (const r of rows) {
      init[r.segment].count += 1;
      init[r.segment].revenue += r.paidRevenue || 0;
    }
    return init;
  }, [rows]);

  if (
    authLoading ||
    (tab === "analytics" && busy) ||
    (tab === "accounts" && accountsLoading)
  ) {
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
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Học sinh</h1>
            <p className="text-gray-600 max-w-2xl">
              Theo dõi thông tin và phân tích dữ liệu học sinh
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={
                tab === "analytics" ? "btn btn-primary" : "btn btn-ghost"
              }
              onClick={() => setTab("analytics")}
            >
              Phân tích
            </button>
            <button
              type="button"
              className={
                tab === "accounts" ? "btn btn-primary" : "btn btn-ghost"
              }
              onClick={() => setTab("accounts")}
            >
              Tài khoản
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {tab === "analytics" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="card p-5">
              <div className="text-xs text-gray-500">Mới / gần đây</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {segmentStats.new_or_recent.count}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {formatUsd(segmentStats.new_or_recent.revenue)}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-gray-500">Đang hoạt động</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {segmentStats.active.count}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {formatUsd(segmentStats.active.revenue)}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-gray-500">Nguy cơ rời bỏ</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {segmentStats.at_risk.count}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {formatUsd(segmentStats.at_risk.revenue)}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-gray-500">Đã rời bỏ</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {segmentStats.churned.count}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {formatUsd(segmentStats.churned.revenue)}
              </div>
            </div>
            <div className="card p-5">
              <div className="text-xs text-gray-500">Tổng cộng</div>
              <div className="text-xl font-bold text-gray-900 mt-1">
                {rows.length}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {formatUsd(rows.reduce((s, r) => s + (r.paidRevenue || 0), 0))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Bộ lọc
                </div>
                <div className="text-sm text-gray-600">
                  Phân nhóm dựa trên thời điểm mua gần nhất (MVP).
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Từ ngày</div>
                  <input
                    className="input"
                    type="date"
                    value={fromYmd}
                    onChange={(e) => setFromYmd(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Đến ngày</div>
                  <input
                    className="input"
                    type="date"
                    value={toYmd}
                    onChange={(e) => setToYmd(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Phân nhóm</div>
                  <select
                    className="input"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                  >
                    <option value="">Tất cả</option>
                    <option value="new_or_recent">Mới / gần đây</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="at_risk">Nguy cơ rời bỏ</option>
                    <option value="churned">Đã rời bỏ</option>
                    <option value="unknown">Chưa phân loại</option>
                  </select>
                </div>
                <div className="min-w-[240px]">
                  <div className="text-xs text-gray-500 mb-1">
                    Tìm theo username
                  </div>
                  <input
                    className="input"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="vd: student_01"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={load}
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="overflow-x-auto border rounded-2xl">
              <table className="min-w-[1200px] w-full text-sm table-fixed">
                <colgroup>
                  <col style={{ width: "200px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "150px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "100px" }} />
                </colgroup>
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border-b">Họ và tên</th>
                    <th className="text-left p-3 border-b">Tên đăng nhập</th>
                    <th className="text-left p-3 border-b">Phân nhóm</th>
                    <th className="text-right p-3 border-b">
                      Doanh thu thuần (LTV)
                    </th>
                    <th className="text-right p-3 border-b">
                      Đơn đã thanh toán
                    </th>
                    <th className="text-right p-3 border-b">
                      Giá trị đơn TB (AOV)
                    </th>
                    <th className="text-left p-3 border-b">Mua lần đầu</th>
                    <th className="text-left p-3 border-b">Mua gần nhất</th>
                    <th className="text-right p-3 border-b">Đơn chờ</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.username}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDetail(r.username)}
                    >
                      <td className="p-3 border-b">
                        <div className="font-semibold text-gray-900 truncate">
                          {nameByUsername[r.username] || "Chưa cập nhật"}
                        </div>
                      </td>
                      <td className="p-3 border-b font-medium text-gray-800 truncate">
                        {r.username}
                      </td>
                      <td className="p-3 border-b">
                        <span
                          className={
                            r.segment === "active"
                              ? "badge badge-success"
                              : r.segment === "new_or_recent"
                              ? "badge badge-primary"
                              : r.segment === "at_risk"
                              ? "badge badge-warning"
                              : r.segment === "churned"
                              ? "badge badge-danger"
                              : "badge"
                          }
                        >
                          {segmentLabel(r.segment)}
                        </span>
                      </td>
                      <td className="p-3 border-b text-right font-semibold">
                        {formatUsd(r.paidRevenue)}
                      </td>
                      <td className="p-3 border-b text-right">
                        {r.paidEnrollments}
                      </td>
                      <td className="p-3 border-b text-right">
                        {formatUsd(r.aov)}
                      </td>
                      <td className="p-3 border-b">
                        {r.firstPaidAt
                          ? new Date(r.firstPaidAt).toLocaleDateString("vi-VN")
                          : "-"}
                      </td>
                      <td className="p-3 border-b">
                        {r.lastPaidAt
                          ? new Date(r.lastPaidAt).toLocaleDateString("vi-VN")
                          : "-"}
                      </td>
                      <td className="p-3 border-b text-right">
                        {r.pendingEnrollments}
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td className="p-3 text-gray-600" colSpan={9}>
                        Chưa có dữ liệu học sinh trong khoảng thời gian này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="text-xs text-gray-500 mt-3">
              Ghi chú: hiện chưa có dữ liệu đơn hàng/hoàn tiền thật; số liệu tạm
              tính dựa trên Enroll(status=paid/not_paid).
            </div>
            {role !== "admin" && role !== "manager" ? (
              <div className="text-xs text-gray-500 mt-1">
                Vai trò hiện tại: {role}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="card p-6">
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
                  <th className="text-left p-3 border-b">Tên đăng nhập</th>
                  <th className="text-left p-3 border-b">Email</th>
                  <th className="text-left p-3 border-b">Vai trò</th>
                  <th className="text-left p-3 border-b">Số điện thoại</th>
                  <th className="text-left p-3 border-b">Ngày tạo</th>
                  <th className="text-left p-3 border-b">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((u) => {
                  const isEditing = editingUserId === u.id;
                  const formData = editForms[u.id] || {
                    firstName: u.firstName || "",
                    lastName: u.lastName || "",
                    phoneNumber: u.phoneNumber || "",
                    email: u.email || "",
                  };
                  const fullName = [u.firstName, u.lastName]
                    .filter(Boolean)
                    .join(" ")
                    .trim();
                  return (
                    <tr
                      key={u.id}
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
                                    [u.id]: {
                                      ...formData,
                                      firstName: e.target.value,
                                    },
                                  })
                                }
                                className="flex-1 min-w-0 h-9 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Họ"
                                disabled={!canEditProfile}
                              />
                              <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) =>
                                  setEditForms({
                                    ...editForms,
                                    [u.id]: {
                                      ...formData,
                                      lastName: e.target.value,
                                    },
                                  })
                                }
                                className="flex-1 min-w-0 h-9 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Tên"
                                disabled={!canEditProfile}
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
                              value={u.username}
                              disabled
                              className="w-full h-9 px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-600"
                              title="Không hỗ trợ đổi username."
                            />
                          ) : (
                            <div className="font-medium text-gray-700 truncate">
                              {u.username}
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
                                  [u.id]: {
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
                              {u.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-b">
                        <div className="h-10 flex items-center">
                          <span
                            className={`badge border ${getRoleColor(
                              "student"
                            )}`}
                          >
                            {getRoleLabel("student")}
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
                                  [u.id]: {
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
                            />
                          ) : u.phoneNumber ? (
                            <div className="text-gray-700 truncate">
                              {u.phoneNumber}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-xs">-</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 border-b">
                        <div className="h-10 flex items-center">
                          <div className="text-xs text-gray-600">
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString(
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
                                onClick={() => onSaveEdit(u)}
                                disabled={savingUserId === u.id}
                              >
                                {savingUserId === u.id ? "..." : "Lưu"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost text-xs px-3 py-1.5 w-[60px] justify-center"
                                onClick={() => onCancelEdit(u.id)}
                                disabled={savingUserId === u.id}
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
                                  onClick={() => onEdit(u)}
                                >
                                  Sửa
                                </button>
                              ) : (
                                <span className="text-xs text-gray-500">
                                  Không có quyền sửa
                                </span>
                              )}
                              {canDelete ? (
                                <button
                                  type="button"
                                  className="btn bg-red-600 text-white hover:bg-red-700 text-xs px-3 py-1.5 w-[60px] justify-center"
                                  onClick={() => setDeleteTarget(u)}
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
                {accounts.length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-600" colSpan={7}>
                      Chưa có học sinh nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DetailDialog
        open={!!selected}
        title={selected ? `Chi tiết học sinh: ${selected}` : ""}
        description={`${fromYmd} → ${toYmd}`}
        onClose={() => {
          setSelected(null);
          setDetail(null);
        }}
      >
        {detailBusy ? (
          <div className="flex items-center justify-center min-h-[20vh]">
            <div className="text-center">
              <div className="loading-spinner h-12 w-12 mx-auto mb-3"></div>
              <div className="text-gray-600">Đang tải chi tiết...</div>
            </div>
          </div>
        ) : detail ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-5">
                <div className="text-xs text-gray-500">Doanh thu thuần</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {formatUsd(detail.student.paidRevenue)}
                </div>
              </div>
              <div className="card p-5">
                <div className="text-xs text-gray-500">Đơn đã thanh toán</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {detail.student.paidEnrollments}
                </div>
              </div>
              <div className="card p-5">
                <div className="text-xs text-gray-500">
                  Giá trị đơn TB (AOV)
                </div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {formatUsd(detail.student.aov)}
                </div>
              </div>
              <div className="card p-5">
                <div className="text-xs text-gray-500">Phân nhóm</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {segmentLabel(detail.student.segment)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-2xl">
              <table className="min-w-[1100px] w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border-b">Ngày</th>
                    <th className="text-left p-3 border-b">Khóa học</th>
                    <th className="text-left p-3 border-b">Danh mục</th>
                    <th className="text-left p-3 border-b">Trạng thái</th>
                    <th className="text-right p-3 border-b">Số tiền (USD)</th>
                    <th className="text-right p-3 border-b">Tiến độ</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.enrollments.map((e) => (
                    <tr key={e.enrollmentId}>
                      <td className="p-3 border-b">
                        {new Date(e.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="p-3 border-b">
                        <div className="font-semibold text-gray-900">
                          {e.courseName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {String(e.courseId)}
                        </div>
                      </td>
                      <td className="p-3 border-b">{e.category}</td>
                      <td className="p-3 border-b">
                        <span
                          className={
                            e.status === "paid"
                              ? "badge badge-success"
                              : "badge badge-warning"
                          }
                        >
                          {e.status === "paid"
                            ? "Đã thanh toán"
                            : "Chờ thanh toán"}
                        </span>
                      </td>
                      <td className="p-3 border-b text-right font-semibold">
                        {formatUsd(e.price || 0)}
                      </td>
                      <td className="p-3 border-b text-right">
                        {typeof e.progress === "number"
                          ? `${e.progress}%`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                  {detail.enrollments.length === 0 && (
                    <tr>
                      <td className="p-3 text-gray-600" colSpan={6}>
                        Chưa có lượt ghi danh trong khoảng thời gian này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">
            Không có dữ liệu chi tiết.
          </div>
        )}
      </DetailDialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa tài khoản học sinh?"
        description={
          deleteTarget
            ? `Bạn sắp xóa "${
                deleteTarget.firstName && deleteTarget.lastName
                  ? `${deleteTarget.firstName} ${deleteTarget.lastName}`
                  : deleteTarget.username
              }" (${getRoleLabel(deleteTarget.role)} - ${
                deleteTarget.email
              }). Thao tác này không thể hoàn tác.`
            : ""
        }
        confirmText="Xóa"
        confirmVariant="danger"
        loading={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
      />
    </div>
  );
}
