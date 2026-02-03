import { db } from "@/db";
import { workouts } from "@/db/schema";

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
