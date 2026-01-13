import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes publiques (pas d'auth nécessaire)
const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/register-pro",
  "/pro",
  "/pro/inscription",
  "/pro/signup",
  "/pro/en-attente",
  "/pro/pending",
  "/legal",
  "/app/billing/success",
  "/api/health",
  "/api/webhooks",
];

// Routes admin uniquement
const ADMIN_ROUTES = [
  "/admin",
];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => {
    if (route.endsWith("/")) {
      return pathname.startsWith(route) || pathname === route.slice(0, -1);
    }
    return pathname === route || pathname.startsWith(route + "/");
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API health/webhooks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    pathname.startsWith("/api/webhooks")
  ) {
    return NextResponse.next();
  }

  // Public routes - allow access
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Get session cookie
  const sessionToken = request.cookies.get("ms_session")?.value;

  // No session - redirect to login for protected routes
  if (!sessionToken) {
    // API routes return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "Non autorisé" } },
        { status: 401 }
      );
    }
    // UI routes redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For protected routes, we need to check the session
  // We'll use a lightweight approach: fetch /api/me to get user info
  // This is done only for dashboard routes that need subscription check
  
  // Check if this is a route that requires subscription
  const requiresSubscription = 
    pathname.startsWith("/clients") ||
    pathname.startsWith("/vehicules") ||
    pathname.startsWith("/interventions") ||
    pathname.startsWith("/documents") ||
    pathname.startsWith("/devis") ||
    pathname.startsWith("/factures") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/notifications");

  // For subscription-required routes, we check via API
  if (requiresSubscription) {
    try {
      const meUrl = new URL("/api/me", request.url);
      const meRes = await fetch(meUrl.toString(), {
        headers: {
          cookie: `ms_session=${sessionToken}`,
        },
        cache: "no-store",
      });

      if (!meRes.ok) {
        // Session invalid - redirect to login
        const loginUrl = new URL("/auth/login", request.url);
        return NextResponse.redirect(loginUrl);
      }

      const meData = await meRes.json();
      
      if (!meData.ok || !meData.data) {
        const loginUrl = new URL("/auth/login", request.url);
        return NextResponse.redirect(loginUrl);
      }

      const { user, plan, subscriptionStatus } = meData.data;

      // Admin users have full access
      if (user?.role === "ADMIN") {
        return NextResponse.next();
      }

      // Check if subscription is active (STARTER or PRO)
      const hasActivePlan = 
        (plan === "STARTER" || plan === "PRO") && 
        (subscriptionStatus === "ACTIVE" || subscriptionStatus === "TRIALING" || subscriptionStatus === "PAST_DUE");

      // If not active, redirect to billing with message
      if (!hasActivePlan) {
        const billingUrl = new URL("/billing", request.url);
        billingUrl.searchParams.set("upgrade", "required");
        billingUrl.searchParams.set("from", pathname);
        return NextResponse.redirect(billingUrl);
      }
    } catch (e) {
      // On error, allow access (fail open for better UX)
      // The page itself will handle auth errors
      console.error("Middleware subscription check error:", e);
    }
  }

  // Admin routes check
  if (matchesRoute(pathname, ADMIN_ROUTES)) {
    try {
      const meUrl = new URL("/api/me", request.url);
      const meRes = await fetch(meUrl.toString(), {
        headers: {
          cookie: `ms_session=${sessionToken}`,
        },
        cache: "no-store",
      });

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.ok && meData.data?.user?.role !== "ADMIN") {
          // Not admin - redirect to dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    } catch (e) {
      console.error("Middleware admin check error:", e);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
