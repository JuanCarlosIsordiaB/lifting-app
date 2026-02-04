# Server Components Coding Standards

## Overview

This project uses Next.js App Router with React Server Components (RSC) as the default. Understanding when to use Server Components vs Client Components is critical for performance and correctness.

## Default Behavior

**All components in the `app/` directory are Server Components by default.**

### Rules

1. **Prefer Server Components** - Use Server Components whenever possible
2. **Use `"use client"` sparingly** - Only add the directive when client-side interactivity is required
3. **Keep Client Components small** - Push `"use client"` as far down the tree as possible
4. **No hooks in Server Components** - `useState`, `useEffect`, etc. are not available

## When to Use Server Components

Use Server Components for:

- Fetching data
- Accessing backend resources directly
- Keeping sensitive information on the server (API keys, tokens)
- Rendering static or data-driven content
- Large dependencies that don't need to be in the client bundle

```typescript
// src/app/dashboard/page.tsx (Server Component - default)
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getWorkouts } from "@/data/workouts";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const workouts = await getWorkouts(userId);

  return (
    <div>
      <h1>Dashboard</h1>
      <WorkoutList workouts={workouts} />
    </div>
  );
}
```

## When to Use Client Components

Add `"use client"` directive only when you need:

- Event handlers (`onClick`, `onChange`, `onSubmit`)
- React hooks (`useState`, `useEffect`, `useContext`, etc.)
- Browser-only APIs (`window`, `document`, `localStorage`)
- Third-party libraries that use hooks or browser APIs

```typescript
// src/app/dashboard/components/workout-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function WorkoutForm() {
  const [name, setName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Handle form submission
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <Button type="submit">Create</Button>
    </form>
  );
}
```

## Component Composition Pattern

Push Client Components down the tree to minimize the client bundle:

### CORRECT - Small Client Component at the leaf

```typescript
// src/app/workouts/page.tsx (Server Component)
import { getWorkouts } from "@/data/workouts";
import { DeleteButton } from "./components/delete-button";

export default async function WorkoutsPage() {
  const workouts = await getWorkouts();

  return (
    <div>
      <h1>Workouts</h1>
      {workouts.map((workout) => (
        <div key={workout.id}>
          <span>{workout.name}</span>
          <DeleteButton workoutId={workout.id} />
        </div>
      ))}
    </div>
  );
}

// src/app/workouts/components/delete-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import { deleteWorkout } from "../actions";

export function DeleteButton({ workoutId }: { workoutId: number }) {
  return (
    <Button onClick={() => deleteWorkout({ workoutId })}>
      Delete
    </Button>
  );
}
```

### INCORRECT - Entire page as Client Component

```typescript
// DON'T DO THIS
"use client";

import { useState, useEffect } from "react";
import { getWorkouts } from "@/data/workouts"; // Won't work!

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    // This pattern is wrong - fetch data in Server Components instead
    fetchWorkouts().then(setWorkouts);
  }, []);

  return <div>{/* ... */}</div>;
}
```

## Data Fetching

### Server Components - Direct Database Access

```typescript
// Server Component - fetch data directly
import { db } from "@/db";
import { workouts } from "@/db/schema";

export default async function Page() {
  const data = await db.select().from(workouts);
  return <WorkoutList workouts={data} />;
}
```

### Client Components - Use Server Actions

```typescript
// Client Component - use server actions for mutations
"use client";

import { createWorkout } from "./actions";

export function CreateForm() {
  async function handleSubmit(data: FormData) {
    await createWorkout({
      name: data.get("name") as string,
    });
  }

  return <form action={handleSubmit}>{/* ... */}</form>;
}
```

## Passing Data Between Server and Client Components

### Props Flow Down

Server Components can pass data to Client Components as props:

```typescript
// Server Component
import { ClientChart } from "./components/client-chart";

export default async function AnalyticsPage() {
  const data = await getAnalyticsData(); // Server-side fetch

  return <ClientChart data={data} />; // Pass to client
}

// Client Component
"use client";

export function ClientChart({ data }: { data: AnalyticsData[] }) {
  // Use client-side charting library
  return <Chart data={data} />;
}
```

### Serialization Requirements

Data passed from Server to Client Components must be serializable:

| Allowed | Not Allowed |
|---------|-------------|
| Strings, numbers, booleans | Functions |
| Arrays, plain objects | Classes/instances |
| Dates (as ISO strings) | Symbols |
| `null`, `undefined` | Map, Set, WeakMap |

```typescript
// CORRECT - Pass serializable data
<ClientComponent
  workout={{
    id: workout.id,
    name: workout.name,
    date: workout.date.toISOString(), // Convert Date to string
  }}
/>

// INCORRECT - Functions are not serializable
<ClientComponent
  onDelete={() => deleteWorkout(id)} // Won't work!
/>
```

## Async Components

Server Components can be async functions:

```typescript
// Server Component - async is allowed
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

Client Components cannot be async:

```typescript
// Client Component - async is NOT allowed
"use client";

// DON'T DO THIS
export default async function Page() { // Error!
  const data = await fetchData();
  return <div>{data}</div>;
}
```

## Loading States

Use `loading.tsx` for Server Component suspense boundaries:

```
src/app/dashboard/
├── page.tsx        # Server Component with data fetching
├── loading.tsx     # Shown while page.tsx is loading
└── error.tsx       # Shown if page.tsx throws
```

```typescript
// src/app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading dashboard...</div>;
}
```

## Summary

| Aspect | Server Component | Client Component |
|--------|------------------|------------------|
| Directive | None (default) | `"use client"` |
| Data fetching | Direct DB/API access | Via Server Actions |
| Hooks | Not available | Available |
| Event handlers | Not available | Available |
| Async component | Allowed | Not allowed |
| Browser APIs | Not available | Available |
| Bundle size | Zero client JS | Adds to bundle |
