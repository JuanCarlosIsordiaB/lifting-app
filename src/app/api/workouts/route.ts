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
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  let startOfDay: Date;
  let endOfDay: Date;

  // Support both single date and date range queries
  if (startDateParam && endDateParam) {
    // Date range query
    startOfDay = new Date(startDateParam);
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay = new Date(endDateParam);
    endOfDay.setHours(23, 59, 59, 999);
  } else if (dateParam) {
    // Single date query
    const date = new Date(dateParam);
    startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
  } else {
    return NextResponse.json(
      { error: "Date parameter(s) required" },
      { status: 400 }
    );
  }

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
