import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  if (pathname !== "/dashboard" && !pathname.startsWith("/dashboard/")) {
    if (pathname !== "/billing" && !pathname.startsWith("/billing/")) {
      return NextResponse.next();
    }
  }

  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "public-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((c) => ({
            name: c.name,
            value: c.value,
          }));
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow the pricing page to be viewed without a login
if (!user && !pathname.startsWith('/pricing')) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirectedFrom", pathname);
  return NextResponse.redirect(loginUrl);
}

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*","/pricing"],
};

