# Authentication Coding Standards

## Authentication Provider

**This project exclusively uses [Clerk](https://clerk.com/) for all authentication.**

### Rules

1. **ONLY use Clerk** - All authentication must be handled through Clerk
2. **NO custom auth solutions** - Do not implement custom authentication logic
3. **Use Clerk components** - Always use Clerk's pre-built components for auth UI

## Setup

### ClerkProvider

The `ClerkProvider` must wrap the entire application in `src/app/layout.tsx`:

```typescript
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Middleware

Authentication middleware is configured in `src/middleware.ts`:

```typescript
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

## Client-Side Components

### Conditional Rendering Based on Auth State

Use `SignedIn` and `SignedOut` components for conditional rendering:

```typescript
import { SignedIn, SignedOut } from "@clerk/nextjs";

<SignedOut>
  {/* Content visible only to signed-out users */}
</SignedOut>

<SignedIn>
  {/* Content visible only to signed-in users */}
</SignedIn>
```

### Sign In / Sign Up Buttons

Use modal mode for sign-in and sign-up flows:

```typescript
import { SignInButton, SignUpButton } from "@clerk/nextjs";

<SignInButton mode="modal">
  <button>Sign In</button>
</SignInButton>

<SignUpButton mode="modal">
  <button>Sign Up</button>
</SignUpButton>
```

### User Button

Display the user profile button for signed-in users:

```typescript
import { UserButton } from "@clerk/nextjs";

<SignedIn>
  <UserButton />
</SignedIn>
```

## Server-Side Authentication

### Getting the Current User

In Server Components or API routes, use `currentUser()` or `auth()`:

```typescript
import { currentUser, auth } from "@clerk/nextjs/server";

// Get full user object
const user = await currentUser();

// Get auth state (lighter weight)
const { userId } = await auth();
```

### Protecting API Routes

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Handle authenticated request
}
```

### Protecting Server Components

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <div>Protected content</div>;
}
```

## Environment Variables

Required environment variables (stored in `.env.local`):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

**NEVER commit these keys to version control.**

## Clerk Components Reference

| Component | Purpose |
|-----------|---------|
| `ClerkProvider` | Wraps app, provides auth context |
| `SignInButton` | Triggers sign-in flow |
| `SignUpButton` | Triggers sign-up flow |
| `SignOutButton` | Signs user out |
| `SignedIn` | Renders children only when signed in |
| `SignedOut` | Renders children only when signed out |
| `UserButton` | User profile dropdown |
| `UserProfile` | Full user profile page |
