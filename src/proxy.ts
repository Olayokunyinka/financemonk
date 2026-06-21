import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Edge-safe route protection via the Next 16 `proxy` convention (formerly
// `middleware`). (Nav-Footer-Global-Standard §5). The nav hides links
// for UX only; THIS is the enforcement and it runs server-side on every request
// to a protected group. We read the JWT directly with getToken so the Prisma
// adapter (not edge-safe) is never imported into the edge runtime.
//
//  /account/*    → any signed-in user
//  /dashboard/*  → signed-in + BUSINESS (or ADMIN). Per-listing ownership is
//                  still enforced server-side in the dashboard pages/actions.
//  /admin/*      → signed-in + ADMIN
//
// All three are noindex (set in their layouts) so crawlers never reach them.

const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secureCookie =
    process.env.NODE_ENV === "production" ||
    req.nextUrl.protocol === "https:";
  const cookieName = secureCookie
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({
    req,
    secret,
    secureCookie,
    cookieName,
    salt: cookieName,
  });
  const role = token?.role as string | undefined;

  const signinUrl = () => {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
    return url;
  };

  // /admin/* — admins only.
  if (pathname.startsWith("/admin")) {
    if (!token) return NextResponse.redirect(signinUrl());
    if (role !== "ADMIN") return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  // /dashboard/* — provider (business) or admin.
  if (pathname.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(signinUrl());
    if (role !== "BUSINESS" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // /account/* — any signed-in user.
  if (pathname.startsWith("/account")) {
    if (!token) return NextResponse.redirect(signinUrl());
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/account/:path*"],
};
