# Data Mutation Standards

This document defines the coding standards for all data mutations in this application.

## Overview

All data mutations follow a two-layer architecture:

1. **Data Layer** (`src/data/`) - Database helper functions using Drizzle ORM
2. **Server Actions** (`actions.ts`) - Validated entry points for mutations

## Data Layer (`src/data/`)

All database operations MUST be performed through helper functions located in the `src/data/` directory. These functions wrap Drizzle ORM calls.

### Structure

```
src/data/
├── workouts.ts      # Workout-related DB operations
├── exercises.ts     # Exercise-related DB operations
├── users.ts         # User-related DB operations
└── ...
```

### Guidelines

- Each domain should have its own file
- Functions should be small and focused on a single operation
- Always use Drizzle ORM for database interactions
- Return typed results

### Example

```typescript
// src/data/workouts.ts
import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function createWorkout(data: {
  userId: string;
  name: string;
  date: Date;
}) {
  const [workout] = await db
    .insert(workouts)
    .values(data)
    .returning();

  return workout;
}

export async function deleteWorkout(workoutId: string) {
  await db.delete(workouts).where(eq(workouts.id, workoutId));
}

export async function updateWorkout(
  workoutId: string,
  data: { name?: string; date?: Date }
) {
  const [workout] = await db
    .update(workouts)
    .where(eq(workouts.id, workoutId))
    .set(data)
    .returning();

  return workout;
}
```

## Server Actions

All data mutations MUST be performed through server actions. Server actions are colocated with their related components in files named `actions.ts`.

### File Naming

Server action files MUST be named `actions.ts` and placed alongside the components that use them:

```
src/app/workouts/
├── page.tsx
├── actions.ts       # Server actions for this route
└── components/
    └── ...
```

### Required Structure

Every server action MUST:

1. Use the `"use server"` directive
2. Have typed parameters (NO `FormData`)
3. Validate all inputs using Zod
4. Call data layer functions for database operations

### Parameter Typing

Server action parameters MUST be explicitly typed. The `FormData` type is NOT allowed.

```typescript
// CORRECT
async function createWorkout(data: { name: string; date: string }) { ... }

// INCORRECT - FormData is not allowed
async function createWorkout(formData: FormData) { ... }
```

### Zod Validation

ALL server actions MUST validate their arguments using Zod schemas.

```typescript
"use server";

import { z } from "zod";
import { createWorkout as createWorkoutDb } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  date: z.string().datetime(),
});

export async function createWorkout(data: { name: string; date: string }) {
  // Validate input
  const validated = createWorkoutSchema.parse(data);

  // Call data layer
  const workout = await createWorkoutDb({
    userId: "...", // from auth
    name: validated.name,
    date: new Date(validated.date),
  });

  return workout;
}
```

### Error Handling

Handle validation errors gracefully and return typed responses:

```typescript
"use server";

import { z } from "zod";
import { deleteWorkout as deleteWorkoutDb } from "@/data/workouts";

const deleteWorkoutSchema = z.object({
  workoutId: z.string().uuid(),
});

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function deleteWorkout(
  data: { workoutId: string }
): Promise<ActionResult<void>> {
  try {
    const validated = deleteWorkoutSchema.parse(data);
    await deleteWorkoutDb(validated.workoutId);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: "Failed to delete workout" };
  }
}
```

## Complete Example

### Data Layer

```typescript
// src/data/exercises.ts
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { eq } from "drizzle-orm";

export type CreateExerciseInput = {
  workoutId: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
};

export async function createExercise(data: CreateExerciseInput) {
  const [exercise] = await db
    .insert(exercises)
    .values(data)
    .returning();

  return exercise;
}

export async function getExercisesByWorkout(workoutId: string) {
  return db
    .select()
    .from(exercises)
    .where(eq(exercises.workoutId, workoutId));
}
```

### Server Action

```typescript
// src/app/workouts/[id]/actions.ts
"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createExercise as createExerciseDb } from "@/data/exercises";
import { revalidatePath } from "next/cache";

const createExerciseSchema = z.object({
  workoutId: z.string().uuid(),
  name: z.string().min(1).max(100),
  sets: z.number().int().min(1).max(100),
  reps: z.number().int().min(1).max(1000),
  weight: z.number().min(0).max(10000),
});

type CreateExerciseInput = z.infer<typeof createExerciseSchema>;

export async function createExercise(data: CreateExerciseInput) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const validated = createExerciseSchema.parse(data);

  const exercise = await createExerciseDb(validated);

  revalidatePath(`/workouts/${validated.workoutId}`);

  return exercise;
}
```

### Component Usage

```typescript
// src/app/workouts/[id]/components/add-exercise-form.tsx
"use client";

import { createExercise } from "../actions";

export function AddExerciseForm({ workoutId }: { workoutId: string }) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Convert FormData to typed object before calling action
    await createExercise({
      workoutId,
      name: formData.get("name") as string,
      sets: Number(formData.get("sets")),
      reps: Number(formData.get("reps")),
      weight: Number(formData.get("weight")),
    });
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>;
}
```

## Summary

| Requirement | Standard |
|-------------|----------|
| Database calls | Via helper functions in `src/data/` |
| ORM | Drizzle ORM only |
| Mutations | Server actions only |
| Action files | Named `actions.ts`, colocated |
| Parameters | Typed objects (NO `FormData`) |
| Validation | Zod schemas required |
