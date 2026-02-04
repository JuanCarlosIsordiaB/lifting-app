# Routing Standards

## Route Structure

**All application routes must be accessed via `/dashboard`.** The root `/` path is reserved for the public landing page only.

```
/                           # Public landing page (unauthenticated)
/dashboard                  # Main dashboard (protected)
/dashboard/workout/new      # Create new workout (protected)
/dashboard/workout/[id]     # View/edit workout (protected)
/dashboard/*                # All sub-routes (protected)
```

## Route Protection

**All `/dashboard` routes are protected and require authentication.**

### Middleware-Based Protection

Route protection is handled via Next.js middleware using Clerk authentication. The middleware runs on every request and protects routes at the edge.

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Rules

1. **Never bypass middleware** - All route protection must go through middleware, not page-level checks
2. **No client-side auth checks for routing** - Do not use `useAuth()` hooks to redirect users; let middleware handle it
3. **Protected routes redirect to sign-in** - Unauthenticated users accessing `/dashboard/*` are automatically redirected to Clerk's sign-in page

## Creating New Routes

### Dashboard Sub-Routes

When creating new routes under `/dashboard`:

1. Create the route in `src/app/dashboard/<route>/page.tsx`
2. The route is automatically protected by middleware - no additional auth code needed
3. Use dynamic segments with brackets: `[id]`, `[workoutId]`, etc.

### Example Structure

```
src/app/
├── page.tsx                          # / (public)
├── layout.tsx                        # Root layout
└── dashboard/
    ├── page.tsx                      # /dashboard
    ├── layout.tsx                    # Dashboard layout (optional)
    └── workout/
        ├── new/
        │   └── page.tsx              # /dashboard/workout/new
        └── [workoutId]/
            └── page.tsx              # /dashboard/workout/:workoutId
```

## API Routes

API routes under `/api/` are also covered by the middleware matcher. Protect API routes that require authentication:

```typescript
// src/app/api/workouts/route.ts
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Handle authenticated request
}
```

## Public Routes

Routes that should remain public (accessible without authentication):

- `/` - Landing page
- `/sign-in` - Clerk sign-in (handled by Clerk)
- `/sign-up` - Clerk sign-up (handled by Clerk)

Do not place public pages under `/dashboard`.
