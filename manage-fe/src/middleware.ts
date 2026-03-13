import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that don't require authentication
const publicPaths = ["/sign-in", "/sign-up", "/apply", "/health"];

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const isAuthenticated = !!accessToken;

  console.log("SkillGro Dashboard Middleware - Path:", pathname);
  console.log(
    "SkillGro Dashboard Middleware - Access Token:",
    accessToken ? "Present" : "Not Present"
  );

  // If user is authenticated and tries to access auth pages, redirect to courses
  if (isAuthenticated && authPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/courses", request.url));
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
