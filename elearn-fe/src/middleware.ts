import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Public paths that don't require authentication
const publicPaths = [
  "/sign-in",
  "/sign-up",
  "/health",
  "/blogs",
  "/events",
  "/",
  "/contact",
  "/about-us",
];

// Auth paths that should redirect to dashboard if authenticated
const authPaths = ["/sign-in", "/sign-up"];

// Security headers
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

// Add security headers to response
function addSecurityHeaders(response: NextResponse) {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    await jwtVerify(token, secret);
    return true;
  } catch (error) {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isAuthenticated = !!accessToken;

  console.log("Middleware - Path:", pathname);
  console.log(
    "Middleware - Access Token:",
    accessToken ? "Present" : "Not Present"
  );
  console.log(
    "Middleware - Refresh Token:",
    refreshToken ? "Present" : "Not Present"
  );

  // If user is authenticated and tries to access auth pages, redirect to dashboard
  if (isAuthenticated && authPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If user is not authenticated and tries to access protected pages (non-public), redirect to sign-in
  if (
    !isAuthenticated &&
    !publicPaths.some((path) => pathname.startsWith(path))
  ) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
