"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Mail,
  Save,
  User,
} from "lucide-react";
import {
  changeAuthPassword,
  getAuthMe,
  getUserInfo,
  updateAuthProfile,
  updateUserInformation,
  type TeacherProfile,
} from "@/lib/api";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState<string>("");

  const [auth, setAuth] = useState<{
    username?: string;
    email?: string;
    role?: string;
  }>({});

  const [profile, setProfile] = useState<TeacherProfile>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    bio: "",
    skill: "",
  });
  const [initialProfile, setInitialProfile] = useState<TeacherProfile | null>(
    null
  );

  const [emailDraft, setEmailDraft] = useState("");
  const [initialEmail, setInitialEmail] = useState<string>("");

  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const normalizeProfile = (p: TeacherProfile) => ({
    firstName: (p.firstName || "").trim(),
    lastName: (p.lastName || "").trim(),
    phoneNumber: (p.phoneNumber || "").trim(),
    address: (p.address || "").trim(),
    bio: (p.bio || "").trim(),
    skill: (p.skill || "").trim(),
    dob: p.dob || "",
  });

  const isProfileDirty = useMemo(() => {
    if (!initialProfile) return false;
    const a = normalizeProfile(initialProfile);
    const b = normalizeProfile(profile);
    return JSON.stringify(a) !== JSON.stringify(b);
  }, [initialProfile, profile]);

  const isEmailDirty = useMemo(() => {
    return emailDraft.trim() !== (initialEmail || "").trim();
  }, [emailDraft, initialEmail]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      setSuccess("");

      const [me, u] = await Promise.all([getAuthMe(), getUserInfo()]);

      if (me.success) {
        setAuth({
          username: me.data?.username,
          email: me.data?.email,
          role: me.data?.role,
        });
        const e = me.data?.email || "";
        setEmailDraft(e);
        setInitialEmail(e);
      }

      if (u.success && u.data) {
        const d = u.data as TeacherProfile;
        const nextProfile: TeacherProfile = {
          username: d.username,
          firstName: d.firstName || "",
          lastName: d.lastName || "",
          phoneNumber: d.phoneNumber || "",
          address: d.address || "",
          bio: d.bio || "",
          skill: d.skill || "",
          dob: d.dob,
          avatarUrl: d.avatarUrl,
          coverUrl: d.coverUrl,
        };
        setProfile(nextProfile);
        setInitialProfile(nextProfile);
      }

      if (!me.success && !u.success) {
        setError("Không thể tải thông tin tài khoản. Vui lòng thử lại.");
      }

      setLoading(false);
    };

    load();
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    setError("");
    setSuccess("");
    const res = await updateUserInformation({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phoneNumber: profile.phoneNumber || "",
      address: profile.address || "",
      bio: profile.bio || "",
      skill: profile.skill || "",
      dob: profile.dob,
    });

    if (res.success) {
      setSuccess("Đã lưu thông tin cá nhân.");
      setInitialProfile((prev) => (prev ? { ...prev, ...profile } : profile));
    } else {
      setError(res.error?.message || "Không thể lưu thông tin cá nhân.");
    }
    setSavingProfile(false);
  };

  const saveEmail = async () => {
    const next = emailDraft.trim();
    if (!next) {
      setError("Email không được để trống.");
      return;
    }
    setSavingAccount(true);
    setError("");
    setSuccess("");
    const res = await updateAuthProfile({ email: next });
    if (res.success) {
      setAuth((p) => ({ ...p, email: next }));
      setInitialEmail(next);
      setSuccess("Đã cập nhật email.");
    } else {
      setError(res.error?.message || "Không thể cập nhật email.");
    }
    setSavingAccount(false);
  };

  const savePassword = async () => {
    setError("");
    setSuccess("");
    if (!pw.currentPassword || !pw.newPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.");
      return;
    }
    if (pw.newPassword !== pw.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setSavingPassword(true);
    const res = await changeAuthPassword({
      currentPassword: pw.currentPassword,
      newPassword: pw.newPassword,
    });
    if (res.success) {
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("Đã đổi mật khẩu thành công.");
    } else {
      setError(res.error?.message || "Không thể đổi mật khẩu.");
    }
    setSavingPassword(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="loading-spinner h-14 w-14 mx-auto mb-4"></div>
          <div className="text-gray-600">Đang tải cài đặt...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="h-5 w-5" />
          {error}
          <button onClick={() => setError("")} className="ml-2">
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 className="h-5 w-5" />
          {success}
          <button onClick={() => setSuccess("")} className="ml-2">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Thông tin cá nhân
            </h2>
          </div>
          <div className="card-content space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Họ</label>
                <input
                  className="input"
                  value={profile.lastName || ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, lastName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Tên</label>
                <input
                  className="input"
                  value={profile.firstName || ""}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, firstName: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-2 mb-1">
                Số điện thoại
              </label>
              <input
                className="input"
                value={profile.phoneNumber || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phoneNumber: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="label">Địa chỉ</label>
              <input
                className="input"
                value={profile.address || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="label">Chuyên môn / Kỹ năng</label>
              <input
                className="input"
                value={profile.skill || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, skill: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="label">Giới thiệu</label>
              <textarea
                className="input min-h-[110px]"
                value={profile.bio || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, bio: e.target.value }))
                }
                placeholder="Mô tả ngắn về bạn (tùy chọn)"
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={saveProfile}
                disabled={!isProfileDirty || savingProfile}
              >
                <Save className="h-4 w-4" />
                {savingProfile
                  ? "Đang lưu..."
                  : isProfileDirty
                  ? "Lưu thông tin cá nhân"
                  : "Chưa có thay đổi"}
              </button>
            </div>
          </div>
        </div>

        {/* Account & Security */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Thông tin tài khoản
              </h2>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="label">Username</label>
                <input className="input" value={auth.username || ""} disabled />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  placeholder="teacher@example.com"
                />
              </div>
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={saveEmail}
                disabled={!isEmailDirty || savingAccount}
              >
                <Save className="h-4 w-4" />
                {savingAccount
                  ? "Đang lưu..."
                  : isEmailDirty
                  ? "Lưu email"
                  : "Chưa có thay đổi"}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-blue-600" />
                Đổi mật khẩu
              </h2>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="label">Mật khẩu hiện tại</label>
                <input
                  className="input"
                  type="password"
                  value={pw.currentPassword}
                  onChange={(e) =>
                    setPw((p) => ({ ...p, currentPassword: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="label">Mật khẩu mới</label>
                <input
                  className="input"
                  type="password"
                  value={pw.newPassword}
                  onChange={(e) =>
                    setPw((p) => ({ ...p, newPassword: e.target.value }))
                  }
                  placeholder="Tối thiểu 8 ký tự, có HOA/thường/số"
                />
              </div>
              <div>
                <label className="label">Xác nhận mật khẩu mới</label>
                <input
                  className="input"
                  type="password"
                  value={pw.confirmPassword}
                  onChange={(e) =>
                    setPw((p) => ({ ...p, confirmPassword: e.target.value }))
                  }
                />
              </div>

              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={savePassword}
                disabled={savingPassword}
              >
                <Save className="h-4 w-4" />
                {savingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
