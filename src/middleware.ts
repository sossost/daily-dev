import createIntlMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'

const ANON_COOKIE_MAX_AGE_SECONDS = 365 * 24 * 60 * 60

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 1. Run next-intl middleware (locale routing: redirect, rewrite)
  const response = intlMiddleware(request)

  // 2. Run Supabase auth on the response
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (url == null || url === '' || key == null || key === '') {
    return response
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        )
      },
    },
  })

  // Refresh session token — do NOT redirect unauthenticated users
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not authenticated and no anonymous cookie → create one
  if (user == null && !request.cookies.has('anon_id')) {
    const anonId = crypto.randomUUID()
    response.cookies.set('anon_id', anonId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ANON_COOKIE_MAX_AGE_SECONDS,
      path: '/',
    })
  }

  return response
}

export const config = {
  matcher: '/((?!api|trpc|auth|_next|_vercel|.*\\..*).*)',
}
