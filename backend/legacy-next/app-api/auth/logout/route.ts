import { NextResponse } from "next/server";

const cookieNames = [
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.account_data",
  "better-auth.dont_remember",
  "better-auth.oauth_state",
  "better-auth.state",
  "sm1_session"
];

export async function POST(request: Request) {
  try {
    await fetch(new URL("/api/auth/sign-out", request.url), {
      method: "POST",
      headers: {
        cookie: request.headers.get("cookie") ?? "",
        origin: request.headers.get("origin") ?? new URL(request.url).origin
      }
    });
  } catch {
    // Cookie expiry below is the important fallback for the browser session.
  }

  const response = NextResponse.json({ success: true });

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });
  }

  return response;
}
