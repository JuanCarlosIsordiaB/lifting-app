import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { Dumbbell } from "lucide-react";

import { getWorkoutById } from "@/data/workouts";
import { db, users } from "@/db";
import { eq } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type WorkoutSet = {
  setNumber: number;
  weight: number;
  weightUnit: string;
  reps: number;
  isCompleted: boolean;
};

type WorkoutExercise = {
  id: string;
  name: string;
  sets: WorkoutSet[];
};

type WorkoutData = {
  id: string;
  name: string;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  scheduledAt: string | null;
  exercises: WorkoutExercise[];
};

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return notFound();
  }

  // Find user by clerkId
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });

  if (!user) {
    return notFound();
  }

  // Fetch the workout
  const workout = await getWorkoutById(Number(workoutId));

  if (!workout) {
    return notFound();
  }

  // Verify the workout belongs to the authenticated user
  if (workout.userId !== user.id) {
    return notFound();
  }

  // Transform data to match the expected format
  const workoutData: WorkoutData = {
    id: workout.id.toString(),
    name: workout.name || "Workout",
    notes: workout.notes,
    startedAt: workout.startedAt,
    completedAt: workout.completedAt,
    scheduledAt: workout.scheduledAt,
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
  };

  // Determine the workout date
  const workoutDate = workoutData.completedAt
    ? new Date(workoutData.completedAt)
    : workoutData.startedAt
      ? new Date(workoutData.startedAt)
      : workoutData.scheduledAt
        ? new Date(workoutData.scheduledAt)
        : null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{workoutData.name}</h1>
          {workoutDate && (
            <p className="text-muted-foreground">
              {format(workoutDate, "do MMM yyyy")}
            </p>
          )}
          {workoutData.notes && (
            <p className="text-sm text-muted-foreground">{workoutData.notes}</p>
          )}
        </div>

        {workoutData.exercises.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No exercises in this workout
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {workoutData.exercises.map((exercise) => (
              <Card key={exercise.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                  <CardDescription>
                    {exercise.sets.length} set{exercise.sets.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-2 text-sm font-medium text-muted-foreground">
                    <span>Set</span>
                    <span>Weight ({exercise.sets[0]?.weightUnit || "kg"})</span>
                    <span>Reps</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {exercise.sets.map((set) => (
                      <div
                        key={set.setNumber}
                        className="grid grid-cols-3 gap-2 text-sm"
                      >
                        <span>{set.setNumber}</span>
                        <span>{set.weight > 0 ? set.weight : "BW"}</span>
                        <span>{set.reps}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
