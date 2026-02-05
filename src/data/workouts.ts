import { db } from "@/db";
import { workouts, workoutExercises, exercises, sets } from "@/db/schema";
import { eq } from "drizzle-orm";

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

export async function getWorkoutById(workoutId: number) {
  const workout = await db.query.workouts.findFirst({
    where: eq(workouts.id, workoutId),
    with: {
      workoutExercises: {
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.orderIndex)],
      },
    },
  });

  return workout;
}
