import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/google/callback`;

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Get stored state from cookie
  const cookies = req.headers.get("cookie") || "";
  const storedStateMatch = cookies.match(/google_oauth_state=([^;]+)/);
  const storedState = storedStateMatch ? storedStateMatch[1] : null;

  // Clear the state cookie
  const clearStateCookie = "google_oauth_state=; Path=/; Max-Age=0";

  // Handle errors from Google
  if (error) {
    const response = NextResponse.redirect(
      new URL(`/auth/login?error=google_${error}`, req.url)
    );
    response.headers.set("Set-Cookie", clearStateCookie);
    return response;
  }

  // Validate state (CSRF protection)
  if (!state || state !== storedState) {
    const response = NextResponse.redirect(
      new URL("/auth/login?error=invalid_state", req.url)
    );
    response.headers.set("Set-Cookie", clearStateCookie);
    return response;
  }

  // Validate code
  if (!code) {
    const response = NextResponse.redirect(
      new URL("/auth/login?error=no_code", req.url)
    );
    response.headers.set("Set-Cookie", clearStateCookie);
    return response;
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      const response = NextResponse.redirect(
        new URL("/auth/login?error=token_exchange_failed", req.url)
      );
      response.headers.set("Set-Cookie", clearStateCookie);
      return response;
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userInfoResponse.ok) {
      console.error("User info fetch failed:", await userInfoResponse.text());
      const response = NextResponse.redirect(
        new URL("/auth/login?error=user_info_failed", req.url)
      );
      response.headers.set("Set-Cookie", clearStateCookie);
      return response;
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    if (!googleUser.email || !googleUser.verified_email) {
      const response = NextResponse.redirect(
        new URL("/auth/login?error=email_not_verified", req.url)
      );
      response.headers.set("Set-Cookie", clearStateCookie);
      return response;
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email.toLowerCase() },
      include: {
        garage: { select: { id: true, name: true, email: true, status: true } },
      },
    });

    if (user) {
      // Existing user - check garage status
      if (user.role !== "ADMIN" && user.garage?.status !== "ACTIVE") {
        const redirectUrl =
          user.garage?.status === "REJECTED"
            ? "/auth/login?error=account_rejected"
            : "/pro/en-attente";
        const response = NextResponse.redirect(new URL(redirectUrl, req.url));
        response.headers.set("Set-Cookie", clearStateCookie);
        return response;
      }

      // Note: googleId field would need to be added to schema for persistence
      // For now, we just proceed with login
    } else {
      // New user - redirect to registration with pre-filled email
      const response = NextResponse.redirect(
        new URL(
          `/pro/inscription?email=${encodeURIComponent(googleUser.email)}&name=${encodeURIComponent(googleUser.name || "")}&google=1`,
          req.url
        )
      );
      response.headers.set("Set-Cookie", clearStateCookie);
      return response;
    }

    // Create session
    const { token, expiresAt } = await createSession(user.id);

    // Redirect to dashboard with session
    const response = NextResponse.redirect(new URL("/dashboard", req.url));
    response.headers.set("Set-Cookie", clearStateCookie);
    setSessionCookie(response, token, expiresAt);

    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    const response = NextResponse.redirect(
      new URL("/auth/login?error=server_error", req.url)
    );
    response.headers.set("Set-Cookie", clearStateCookie);
    return response;
  }
}
