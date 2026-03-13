"use client";

import { useMemo, useState } from "react";
import { Copy, KeyRound, UserPlus } from "lucide-react";

type CenterRole = "admin" | "manager" | "recruiter" | "accountant";

function randomPassword() {
  // Satisfy auth-service rule: min 8, at least 1 lowercase, 1 uppercase, 1 number
  const base = Math.random().toString(16).slice(2, 6);
  const num = Math.floor(Math.random() * 90 + 10);
  return `SkillGro${num}A${base}a`;
}

export function SecretCreateUserForm({ secretKey }: { secretKey: string }) {
  const [role, setRole] = useState<CenterRole>("manager");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [created, setCreated] = useState<{
    username: string;
    email: string;
    password: string;
    role: CenterRole;
  } | null>(null);

  const canSubmit = useMemo(() => {
    if (!username.trim()) return false;
    if (!email.trim()) return false;
    if (!password.trim()) return false;
    return true;
  }, [username, email, password]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Đã copy.");
      setTimeout(() => setMsg(""), 1200);
    } catch {
      setMsg("Không copy được (trình duyệt chặn).");
    }
  };

  const onCreate = async () => {
    setLoading(true);
    setMsg("");
    setCreated(null);
    try {
      const res = await fetch("/api/secret/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-center-secret": secretKey,
        },
        body: JSON.stringify({ username, email, password, role }),
      });
      const json = (await res.json().catch(() => null)) as
        | {
            status: "success";
            data?: {
              auth?: unknown;
              profile?: { ok?: boolean; message?: string };
            };
          }
        | { status: "error"; message: string };

      if (!res.ok || !json || json.status !== "success") {
        setMsg(
          (json && json.status === "error" && json.message) ||
            "Không thể tạo user."
        );
        return;
      }

      setCreated({ username, email, password, role });
      const profileOk = json.data?.profile?.ok;
      if (profileOk === false) {
        setMsg(
          `Tạo user thành công, nhưng chưa tạo được profile rỗng ở elearn-db. ${
            json.data?.profile?.message || ""
          }`.trim()
        );
      } else {
        setMsg("Tạo user + profile rỗng thành công.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="card-glass p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">/secret</h1>
            <p className="text-gray-600">
              Trang nội bộ để tạo tài khoản test cho Center (dev-only). Không dùng
              production.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <KeyRound className="h-4 w-4" />
            key ok
          </div>
        </div>
      </div>

      {msg && <div className="alert alert-info">{msg}</div>}

      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value as CenterRole)}
            >
              <option value="admin">admin</option>
              <option value="manager">manager</option>
              <option value="recruiter">recruiter</option>
              <option value="accountant">accountant</option>
            </select>
          </div>
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="center_manager_01 (tự đặt)"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager01@skillgro.local (tự đặt)"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="SkillGro2025A..."
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setPassword(randomPassword())}
                title="Generate password"
              >
                <KeyRound className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Rule: ≥8 ký tự, có chữ hoa, chữ thường, số.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {!canSubmit && (
            <div className="text-sm text-gray-500 mr-auto">
              Nhập <b>Username</b> và <b>Email</b> để bật nút “Tạo user”.
            </div>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onCreate}
            disabled={!canSubmit || loading}
          >
            <UserPlus className="h-4 w-4" />
            {loading ? "Đang tạo..." : "Tạo user"}
          </button>
        </div>
      </div>

      {created && (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                Credentials
              </div>
              <div className="text-sm text-gray-700 mt-2 space-y-1">
                <div>
                  <b>role</b>: {created.role}
                </div>
                <div>
                  <b>username</b>: {created.username}
                </div>
                <div>
                  <b>email</b>: {created.email}
                </div>
                <div>
                  <b>password</b>: {created.password}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                copy(
                  `role=${created.role}\nusername=${created.username}\nemail=${created.email}\npassword=${created.password}\n`
                )
              }
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


