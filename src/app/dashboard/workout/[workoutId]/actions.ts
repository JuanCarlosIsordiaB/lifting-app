"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  getWorkoutById as getWorkoutByIdDb,
  updateWorkout as updateWorkoutDb,
} from "@/data/workouts";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const updateWorkoutSchema = z.object({
  workoutId: z.number(),
  name: z.string().min(1, "Name is required").max(255),
  notes: z.string().max(1000).optional(),
  scheduledAt: z.string().optional(),
});

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getWorkout(
  workoutId: number
): Promise<ActionResult<Awaited<ReturnType<typeof getWorkoutByIdDb>>>> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (user.length === 0) {
      return { success: false, error: "User not found" };
    }

    const workout = await getWorkoutByIdDb(workoutId, user[0].id);

    if (!workout) {
      return { success: false, error: "Workout not found" };
    }

    return { success: true, data: workout };
  } catch {
    return { success: false, error: "Failed to fetch workout" };
  }
}

export async function updateWorkout(data: {
  workoutId: number;
  name: string;
  notes?: string;
  scheduledAt?: string;
}): Promise<ActionResult> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const validated = updateWorkoutSchema.parse(data);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (user.length === 0) {
      return { success: false, error: "User not found" };
    }

    const workout = await updateWorkoutDb(validated.workoutId, user[0].id, {
      name: validated.name,
      notes: validated.notes || null,
      scheduledAt: validated.scheduledAt
        ? new Date(validated.scheduledAt)
        : null,
    });

    if (!workout) {
      return { success: false, error: "Workout not found" };
    }

    redirect(`/dashboard/workout/${validated.workoutId}`);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to update workout" };
  }
}
