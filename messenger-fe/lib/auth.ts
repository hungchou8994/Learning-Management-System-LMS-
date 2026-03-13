export type MessengerAuthUser = {
  id: string | number;
  username: string;
  email?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

const DEFAULT_GATEWAY = "http://localhost:3000";

function normalizeBaseUrl(raw: string) {
  const s = String(raw || "").trim();
  if (!s) return DEFAULT_GATEWAY;
  // If user sets "localhost:3000" (missing scheme), browsers treat it as an unsupported URL scheme.
  if (!/^https?:\/\//i.test(s)) {
    return `http://${s}`.replace(/\/+$/, "");
  }
  return s.replace(/\/+$/, "");
}

export function getGatewayBase() {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_API_GATEWAY_URL || DEFAULT_GATEWAY);
}

async function parseJson(resp: Response) {
  return await resp.json().catch(() => null);
}

export async function authMe(): Promise<ApiResult<MessengerAuthUser>> {
  try {
    const resp = await fetch(`${getGatewayBase()}/api/auth/me`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    const data = await parseJson(resp);
    if (!resp.ok || !data || data.status !== "success" || !data.user) {
      return {
        ok: false,
        status: resp.status,
        error: data?.message || "Not authenticated",
      };
    }
    return { ok: true, data: data.user as MessengerAuthUser };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function authLogin(params: { username: string; password: string }): Promise<ApiResult<MessengerAuthUser>> {
  try {
    const resp = await fetch(`${getGatewayBase()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(params),
    });
    const data = await parseJson(resp);
    if (!resp.ok || !data || data.status !== "success") {
      return { ok: false, status: resp.status, error: data?.message || "Login failed" };
    }
    const user = data?.data?.user;
    if (user) return { ok: true, data: user as MessengerAuthUser };
    return await authMe();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function authLogout(): Promise<ApiResult<true>> {
  try {
    const resp = await fetch(`${getGatewayBase()}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    const data = await parseJson(resp);
    if (!resp.ok || !data || data.status !== "success") {
      return { ok: false, status: resp.status, error: data?.message || "Logout failed" };
    }
    return { ok: true, data: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}


