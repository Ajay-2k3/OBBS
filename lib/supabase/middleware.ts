import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { canAccessRoute, routeByRole } from '../role-router'

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
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        // After successful auth, redirect to homepage and let the middleware handle role-based routing
        const forwardedHost = request.headers.get("x-forwarded-host")
        const isLocalEnv = process.env.NODE_ENV === "development"

        if (isLocalEnv) {
          return NextResponse.redirect(new URL("/", request.url))
        } else if (forwardedHost) {
          return NextResponse.redirect(new URL("/", `https://${forwardedHost}`))
        } else {
          return NextResponse.redirect(new URL("/", request.url))
        }
      }
    } catch (error) {
      console.error("Auth callback error:", error)
      // Continue with normal flow if callback fails
    }
  }

  // Check authentication for protected routes
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith("/auth")
  const isHomePage = pathname === "/"
  const isProtectedRoute = !isAuthPage && !isHomePage && !pathname.startsWith("/_next")

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Handle authenticated user on homepage or auth pages
  if (user && (isAuthPage || isHomePage)) {
    try {
      // Use service role client to bypass RLS for user lookup
      const serviceClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              // No need to set cookies for service client
            },
          },
        },
      )

      // Get user profile using service role to bypass RLS
      const { data: profile, error } = await serviceClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error("User profile lookup error:", error)
        // If user not found in users table, redirect to login to force re-registration
        return NextResponse.redirect(new URL("/auth/login?error=profile_not_found", request.url))
      }

      if (profile?.role) {
        const roleRoute = routeByRole(profile.role as any)
        return NextResponse.redirect(new URL(roleRoute, request.url))
      } else {
        // No role found, redirect to login
        return NextResponse.redirect(new URL("/auth/login?error=no_role", request.url))
      }
    } catch (error) {
      console.error("User role lookup error:", error)
      return NextResponse.redirect(new URL("/auth/login?error=lookup_failed", request.url))
    }
  }

  // Role-based routing for dashboard pages
  if (user && pathname.startsWith('/dashboard')) {
    try {
      // Use service role client to bypass RLS for user lookup
      const serviceClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              // No need to set cookies for service client
            },
          },
        },
      )

      // Get user profile using service role to bypass RLS
      const { data: profile, error } = await serviceClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error("User profile lookup error:", error)
        // If user not found in users table, redirect to login
        return NextResponse.redirect(new URL("/auth/login?error=profile_not_found", request.url))
      }

      if (profile?.role) {
        // If accessing general /dashboard, redirect to role-specific dashboard
        if (pathname === '/dashboard') {
          const roleRoute = routeByRole(profile.role as any)
          return NextResponse.redirect(new URL(roleRoute, request.url))
        }

        // Check if user can access the requested route
        if (!canAccessRoute(profile.role as any, pathname)) {
          const roleRoute = routeByRole(profile.role as any)
          return NextResponse.redirect(new URL(roleRoute, request.url))
        }
      } else {
        // No role found, redirect to login
        return NextResponse.redirect(new URL("/auth/login?error=no_role", request.url))
      }
    } catch (error) {
      console.error("Role-based routing error:", error)
      // If there's an error, redirect to login instead of continuing
      return NextResponse.redirect(new URL("/auth/login?error=routing_failed", request.url))
    }
  }

  return supabaseResponse
}
