import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ADMIN_EMAILS } from "./utils/adminCheck";

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  const { pathname } = request.nextUrl;

  // If user is on root path
  if (pathname === "/") {
    // Check if there's a logout message - allow it to show regardless of token status
    const message = request.nextUrl.searchParams.get("message");
    if (message === "logged-out") {
      return NextResponse.next();
    }
    
    if (token) {
      // User is signed in, redirect to home
      return NextResponse.redirect(new URL("/home", request.url));
    }
    // User is not signed in, allow access to root page
    return NextResponse.next();
  }

  // Protected routes that require authentication
  if (pathname.startsWith("/conversations") || pathname.startsWith("/home")) {
    if (!token) {
      // User is not signed in, redirect to root with message
      const url = new URL("/", request.url);
      url.searchParams.set("message", "not-signed-in");
      return NextResponse.redirect(url);
    }

    // Admin-only routes
    const userEmail = token.email as string;
    const isAdmin = userEmail && ADMIN_EMAILS.includes(userEmail);

    // Check if accessing admin-only conversation routes
    if (pathname.startsWith("/conversations/create") || pathname.startsWith("/conversations/dashboard")) {
      if (!isAdmin) {
        // User is not admin, redirect to home
        return NextResponse.redirect(new URL("/home", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - signin (signin page)
     * - auth (auth pages)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|signin|auth).*)",
  ],
};
