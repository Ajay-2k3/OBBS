import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Handle auth callback
  const url = new URL(request.url)
  const code = url.searchParams.get("code")

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocalEnv = process.env.NODE_ENV === "development"

      if (isLocalEnv) {
        return NextResponse.redirect(`${url.origin}/dashboard`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}/dashboard`)
      } else {
        return NextResponse.redirect(`${url.origin}/dashboard`)
      }
    }
  }

  // Check authentication for protected routes
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth") || request.nextUrl.pathname === "/"
  const isProtectedRoute = !isAuthPage && !request.nextUrl.pathname.startsWith("/_next")

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (isAuthPage && user && request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return supabaseResponse
}
