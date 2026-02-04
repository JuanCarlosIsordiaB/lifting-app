import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db, workouts, users } from "@/db";
import { eq, and, gte, lt, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const dateParam = searchParams.get("date");

  if (!dateParam) {
    return NextResponse.json(
      { error: "Date parameter is required" },
      { status: 400 }
    );
  }

  // Parse the date and create start/end of day
  const date = new Date(dateParam);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Find user by clerkId
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch workouts for the user on the specified date (by startedAt or scheduledAt)
  const userWorkouts = await db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, user.id),
      eq(workouts.isTemplate, false),
      or(
        and(gte(workouts.startedAt, startOfDay), lt(workouts.startedAt, endOfDay)),
        and(gte(workouts.scheduledAt, startOfDay), lt(workouts.scheduledAt, endOfDay))
      )
    ),
    with: {
      workoutExercises: {
        orderBy: (workoutExercises, { asc }) => [asc(workoutExercises.orderIndex)],
        with: {
          exercise: true,
          sets: {
            orderBy: (sets, { asc }) => [asc(sets.setNumber)],
          },
        },
      },
    },
  });

  // Transform data to match the expected format
  const transformedWorkouts = userWorkouts.map((workout) => ({
    id: workout.id.toString(),
    name: workout.name || "Workout",
    notes: workout.notes,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt,
    exercises: workout.workoutExercises.map((we) => ({
      id: we.id.toString(),
      name: we.exercise.name,
      sets: we.sets.map((set) => ({
        setNumber: set.setNumber,
        weight: set.weight ?? 0,
        weightUnit: set.weightUnit ?? "kg",
        reps: set.reps ?? 0,
        isCompleted: set.isCompleted,
      })),
    })),
  }));

  return NextResponse.json(transformedWorkouts);
}
