import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/better-auth";
import { getUserBySessionToken } from "@/lib/auth/password-account";

export async function GET(request: Request) {
  const token = (await cookies()).get("sm1_session")?.value;

  if (token) {
    try {
      const session = await Promise.race([getUserBySessionToken(token), timeoutSessionLookup()]);

      if (session) {
        return NextResponse.json(session);
      }
    } catch {
      // Fall through to Better Auth session lookup.
    }
  }

  try {
    const session = await Promise.race([auth.api.getSession({ headers: request.headers }), timeoutSessionLookup()]);

    if (!session?.session || !session.user?.id) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      session: session.session,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        level: "初学弟子"
      }
    });
  } catch {
    return NextResponse.json(null);
  }
}

function timeoutSessionLookup() {
  return new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), 4000);
  });
}
