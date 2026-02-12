import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/audit(.*)',
  '/pricing',
  '/api/audit/free(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])
const isPracticeRoute = createRouteMatcher(['/practice(.*)'])
const isManagerRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return

  const { userId, orgId, orgRole } = await auth.protect()

  if (!userId) return

  if (!orgId && !isOnboardingRoute(request)) {
    return Response.redirect(new URL('/onboarding/start', request.url))
  }

  if (isPracticeRoute(request) && orgRole === 'org:manager') {
    return Response.redirect(new URL('/dashboard', request.url))
  }

  if (isManagerRoute(request) && orgRole === 'org:practice_owner') {
    return Response.redirect(new URL('/practice/dashboard', request.url))
  }
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
