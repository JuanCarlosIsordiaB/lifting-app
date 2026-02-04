import { db } from "@/db";
import { workouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type CreateWorkoutInput = {
  userId: number;
  name: string;
  notes?: string | null;
  scheduledAt?: Date | null;
};

export async function createWorkout(data: CreateWorkoutInput) {
  const [workout] = await db
    .insert(workouts)
    .values({
      userId: data.userId,
      name: data.name,
      notes: data.notes,
      scheduledAt: data.scheduledAt,
    })
    .returning();

  return workout;
}

export async function getWorkoutById(workoutId: number, userId: number) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .limit(1);

  return workout;
}

export type UpdateWorkoutInput = {
  name?: string;
  notes?: string | null;
  scheduledAt?: Date | null;
};

export async function updateWorkout(
  workoutId: number,
  userId: number,
  data: UpdateWorkoutInput
) {
  const [workout] = await db
    .update(workouts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .returning();

  return workout;
}
