import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CenterRole = "admin" | "manager" | "recruiter" | "accountant";

function isCenterRole(v: unknown): v is CenterRole {
  return v === "admin" || v === "manager" || v === "recruiter" || v === "accountant";
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export async function POST(req: Request) {
  try {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ status: "error", message: "Not found" }, { status: 404 });
    }

    const serverKey = process.env.CENTER_SECRET_KEY;
    if (!serverKey) {
      return NextResponse.json(
        { status: "error", message: "Thiếu CENTER_SECRET_KEY trên server." },
        { status: 500 }
      );
    }

    const headerKey = req.headers.get("x-center-secret");
    if (!headerKey || headerKey !== serverKey) {
      return NextResponse.json({ status: "error", message: "Forbidden" }, { status: 403 });
    }

    const bodyUnknown = (await req.json().catch(() => null)) as unknown;
    const body = isRecord(bodyUnknown) ? bodyUnknown : {};
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role as unknown;

    if (!username || !email || !password || !isCenterRole(role)) {
      return NextResponse.json(
        { status: "error", message: "Dữ liệu không hợp lệ (username/email/password/role)." },
        { status: 400 }
      );
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const upstream = await fetch(`${apiBase}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // IMPORTANT: do not include credentials; do not forward Set-Cookie to browser.
      body: JSON.stringify({ username, email, password, role }),
    });

    const data = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json(
        { status: "error", message: data?.message || "Không thể tạo user." },
        { status: 400 }
      );
    }

    // Also create an empty profile in elearn-db (dev-only)
    let profileOk = false;
    let profileMessage = "";
    try {
      const profileRes = await fetch(`${apiBase}/api/elearn/user/secret/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-center-secret": serverKey,
        },
        body: JSON.stringify({ username }),
      });
      const profileJson = await profileRes.json().catch(() => null);
      profileOk = profileRes.ok && profileJson && profileJson.status === "success";
      if (!profileOk) {
        profileMessage =
          (profileJson && profileJson.message) || "Không thể tạo profile rỗng ở elearn-db.";
      }
    } catch (e: unknown) {
      if(e === "1") console.error("Error creating profile in elearn-db:", e);
      profileOk = false;
      profileMessage = "Lỗi khi tạo profile rỗng ở elearn-db.";
    }

    return NextResponse.json(
      {
        status: "success",
        data: {
          auth: data,
          profile: { ok: profileOk, message: profileMessage },
        },
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    const details =
      typeof e === "object" && e !== null && "message" in e ? String((e as { message?: unknown }).message) : String(e);
    return NextResponse.json(
      {
        status: "error",
        message: "Lỗi server khi tạo user.",
        details,
      },
      { status: 500 }
    );
  }
}


