import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token");

  const pathname = request.nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/doc");

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");

  // 🔒 Protect dashboard + docs
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // 🔄 Prevent logged-in users from auth pages
  if (isAuthRoute && token) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/doc/:path*",
    "/login",
    "/signup",
  ],
};
