"use client";

import { useEffect, useMemo, useState } from "react";
import {
  listAuthUsers,
  deleteAuthUser,
  getUserProfilesByUsernames,
  updateAuthUser,
  updateUserInformationByUsername,
  type AuthUser,
} from "@/lib/api";
import { useRoleGuard } from "@/lib/useRoleGuard";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function StaffPage() {
  const { loading: authLoading } = useRoleGuard(["admin"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<AuthUser[]>([]);

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
        role: string;
      }
    >
  >({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // Get users from Auth Service
      const authRes = await listAuthUsers();
      if (!authRes.success || !authRes.data) {
        setError(authRes.error?.message || "Không thể tải danh sách nhân sự.");
        setUsers([]);
        setLoading(false);
        return;
      }

      // Filter center roles
      const centerUsers = authRes.data.filter((u) =>
        ["admin", "manager", "recruiter", "accountant"].includes(u.role)
      );

      // Get user profiles from elearn-db
      const usernames = centerUsers.map((u) => u.username);
      const profilesRes = await getUserProfilesByUsernames(usernames);

      // Merge data
      const profileMap = new Map();
      if (profilesRes.success && profilesRes.data) {
        profilesRes.data.forEach((profile) => {
          profileMap.set(profile.username, profile);
        });
      }

      // Combine auth data with profile data
      const mergedUsers: AuthUser[] = centerUsers.map((user) => {
        const profile = profileMap.get(user.username);
        return {
          ...user,
          firstName: profile?.firstName || null,
          lastName: profile?.lastName || null,
          phoneNumber: profile?.phoneNumber || null,
          avatarUrl: profile?.avatarUrl || null,
        };
      });

      setUsers(mergedUsers);
    } catch (e: unknown) {
      setError(
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : "Không thể tải dữ liệu."
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      const res = await deleteAuthUser(deleteTarget.id);
      if (!res.success) throw new Error(res.error?.message || "Xóa thất bại");
      setDeleteTarget(null);
      await load();
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
    setEditingUserId(user.id);
    setEditForms({
      ...editForms,
      [user.id]: {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
        role: user.role || "manager",
      },
    });
  };

  const onCancelEdit = (userId: string) => {
    setEditingUserId(null);
    const newForms = { ...editForms };
    delete newForms[userId];
    setEditForms(newForms);
  };

  const onSaveEdit = async (user: AuthUser) => {
    const formData = editForms[user.id];
    if (!formData) return;

    setSavingUserId(user.id);
    setError("");
    try {
      const ops: Promise<unknown>[] = [];

      const nextEmail = formData.email.trim();
      const nextRole = formData.role;

      if (nextEmail !== user.email || nextRole !== user.role) {
        ops.push(updateAuthUser(user.id, { email: nextEmail, role: nextRole }));
      }

      ops.push(
        updateUserInformationByUsername(user.username, {
          firstName: formData.firstName.trim() || undefined,
          lastName: formData.lastName.trim() || undefined,
          phoneNumber: formData.phoneNumber.trim() || undefined,
        })
      );

      const results = await Promise.all(ops);
      const authRes = results.find(
        (r) =>
          typeof r === "object" && r !== null && "success" in r && "error" in r
      ) as { success?: boolean; error?: { message?: string } } | undefined;
      if (authRes && authRes.success === false) {
        throw new Error(
          authRes.error?.message || "Cập nhật tài khoản thất bại"
        );
      }

      const profileRes = results.find(
        (r) =>
          typeof r === "object" && r !== null && "success" in r && "data" in r
      ) as { success?: boolean; error?: { message?: string } } | undefined;
      if (profileRes && profileRes.success === false) {
        throw new Error(
          profileRes.error?.message || "Cập nhật profile thất bại"
        );
      }

      setEditingUserId(null);
      const newForms = { ...editForms };
      delete newForms[user.id];
      setEditForms(newForms);
      await load();
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

  // Thống kê theo role
  const roleStats = useMemo(() => {
    const stats = {
      admin: 0,
      manager: 0,
      recruiter: 0,
      accountant: 0,
    };
    users.forEach((u) => {
      if (u.role in stats) {
        stats[u.role as keyof typeof stats]++;
      }
    });
    return stats;
  }, [users]);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: "Quản trị viên",
      manager: "Quản lý",
      recruiter: "Nhân sự",
      accountant: "Kế toán",
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800 border-red-200",
      manager: "bg-blue-100 text-blue-800 border-blue-200",
      recruiter: "bg-green-100 text-green-800 border-green-200",
      accountant: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return colors[role] || "bg-gray-100 text-gray-800 border-gray-200";
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
          Nhân sự trung tâm
        </h1>
        <p className="text-gray-600">
          Quản lý tài khoản nội bộ theo vai trò, cập nhật thông tin nhanh và
          kiểm soát quyền truy cập an toàn.
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs text-gray-500">Tổng nhân sự</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {users.length}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500">Quản trị viên</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {roleStats.admin}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500">Quản lý</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {roleStats.manager}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-gray-500">Tuyển dụng + Kế toán</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {roleStats.recruiter + roleStats.accountant}
          </div>
        </div>
      </div>

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
                <th className="text-left p-3 border-b">Username</th>
                <th className="text-left p-3 border-b">Email</th>
                <th className="text-left p-3 border-b">Role</th>
                <th className="text-left p-3 border-b">Số điện thoại</th>
                <th className="text-left p-3 border-b">Ngày tạo</th>
                <th className="text-left p-3 border-b">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditing = editingUserId === u.id;
                const formData = editForms[u.id] || {
                  firstName: u.firstName || "",
                  lastName: u.lastName || "",
                  phoneNumber: u.phoneNumber || "",
                  email: u.email || "",
                  role: u.role || "manager",
                };
                const fullName = [u.firstName, u.lastName]
                  .filter(Boolean)
                  .join(" ")
                  .trim();
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
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
                            title="Không hỗ trợ đổi username (ảnh hưởng dữ liệu liên kết)."
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
                            onChange={(e) =>
                              setEditForms({
                                ...editForms,
                                [u.id]: { ...formData, email: e.target.value },
                              })
                            }
                            className="w-full h-9 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Email"
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
                        {isEditing ? (
                          <select
                            className="w-full h-9 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            value={formData.role}
                            onChange={(e) =>
                              setEditForms({
                                ...editForms,
                                [u.id]: { ...formData, role: e.target.value },
                              })
                            }
                          >
                            <option value="admin">Quản trị viên</option>
                            <option value="manager">Quản lý</option>
                            <option value="recruiter">Nhân sự</option>
                            <option value="accountant">Kế toán</option>
                          </select>
                        ) : (
                          <span
                            className={`badge border ${getRoleColor(u.role)}`}
                            title={getRoleLabel(u.role)}
                          >
                            {getRoleLabel(u.role)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border-b">
                      <div className="h-10 flex items-center">
                        {isEditing ? (
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) =>
                              setEditForms({
                                ...editForms,
                                [u.id]: {
                                  ...formData,
                                  phoneNumber: e.target.value,
                                },
                              })
                            }
                            className="w-full h-9 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                              {savingUserId === u.id ? "Đang lưu..." : "Lưu"}
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
                            <button
                              type="button"
                              className="btn bg-blue-600 text-white hover:bg-blue-700 text-xs px-3 py-1.5 w-[60px] justify-center"
                              onClick={() => onEdit(u)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="btn bg-red-600 text-white hover:bg-red-700 text-xs px-3 py-1.5 w-[60px] justify-center"
                              onClick={() => setDeleteTarget(u)}
                            >
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-600 text-center" colSpan={7}>
                    Chưa có nhân sự nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa tài khoản nhân sự?"
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
