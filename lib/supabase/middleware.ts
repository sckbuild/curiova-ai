import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isConfigured() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) return false;
    new URL(supabaseUrl);
    return true;
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  const passthrough = NextResponse.next({ request });

  if (!isConfigured()) {
    return { supabaseResponse: passthrough, user: null };
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session — must be called before any other Supabase calls
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
