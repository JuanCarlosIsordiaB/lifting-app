"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createWorkout as createWorkoutDb } from "@/data/workouts";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const createWorkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  notes: z.string().max(1000).optional(),
  scheduledAt: z.string().optional(),
});

type ActionResult =
  | { success: true }
  | { success: false; error: string };

export async function createWorkout(data: {
  name: string;
  notes?: string;
  scheduledAt?: string;
}): Promise<ActionResult> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const validated = createWorkoutSchema.parse(data);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    if (user.length === 0) {
      return { success: false, error: "User not found" };
    }

    await createWorkoutDb({
      userId: user[0].id,
      name: validated.name,
      notes: validated.notes || null,
      scheduledAt: validated.scheduledAt
        ? new Date(validated.scheduledAt)
        : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: "Failed to create workout" };
  }

  redirect("/dashboard");
}
