import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getWorkoutById } from "@/data/workouts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const { workoutId } = await params;
  const workoutIdNum = parseInt(workoutId, 10);

  if (isNaN(workoutIdNum)) {
    notFound();
  }

  const workout = await getWorkoutById(workoutIdNum);

  if (!workout) {
    notFound();
  }

  // Authorization check - ensure the workout belongs to the authenticated user
  if (workout.userId.toString() !== userId) {
    notFound();
  }

  // Determine which date to display (priority: completedAt > startedAt > scheduledAt)
  const displayDate = workout.completedAt || workout.startedAt || workout.scheduledAt;
  const formattedDate = displayDate ? format(displayDate, "do MMM yyyy") : "No date set";

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{workout.name || "Workout"}</h1>
        <p className="text-muted-foreground">{formattedDate}</p>
        {workout.notes && (
          <p className="mt-4 text-sm text-muted-foreground">{workout.notes}</p>
        )}
      </div>

      {workout.workoutExercises.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No exercises in this workout yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {workout.workoutExercises.map((we) => (
            <Card key={we.id}>
              <CardHeader>
                <CardTitle>{we.exercise.name}</CardTitle>
                {we.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{we.notes}</p>
                )}
              </CardHeader>
              <CardContent>
                {we.sets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sets recorded</p>
                ) : (
                  <div className="space-y-2">
                    {we.sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between py-2 border-b last:border-b-0"
                      >
                        <span className="text-sm font-medium">Set {set.setNumber}</span>
                        <div className="flex items-center gap-4 text-sm">
                          {set.weight && (
                            <span>
                              {set.weight} {set.weightUnit || "kg"}
                            </span>
                          )}
                          {set.reps && <span>{set.reps} reps</span>}
                          {set.durationSeconds && (
                            <span>{set.durationSeconds}s</span>
                          )}
                          {set.isCompleted && (
                            <span className="text-green-600 dark:text-green-400">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
