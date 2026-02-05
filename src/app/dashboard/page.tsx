"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { CalendarIcon, Dumbbell, Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

type Workout = {
  id: string;
  name: string;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  exercises: WorkoutExercise[];
};

async function fetchWorkoutsForDate(date: Date): Promise<Workout[]> {
  const dateStr = format(date, "yyyy-MM-dd");
  const response = await fetch(`/api/workouts?date=${dateStr}`);

  if (!response.ok) {
    throw new Error("Failed to fetch workouts");
  }

  return response.json();
}

async function fetchWorkoutDatesForMonth(month: Date): Promise<Date[]> {
  const start = format(startOfMonth(month), "yyyy-MM-dd");
  const end = format(endOfMonth(month), "yyyy-MM-dd");
  const response = await fetch(`/api/workouts?startDate=${start}&endDate=${end}`);

  if (!response.ok) {
    throw new Error("Failed to fetch workout dates");
  }

  const workouts: Workout[] = await response.json();

  // Extract unique dates from workouts
  const uniqueDates = new Set<string>();
  workouts.forEach((workout) => {
    if (workout.completedAt) {
      const workoutDate = format(new Date(workout.completedAt), "yyyy-MM-dd");
      uniqueDates.add(workoutDate);
    }
  });

  return Array.from(uniqueDates).map((dateStr) => new Date(dateStr));
}

export default function DashboardPage() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [workoutDates, setWorkoutDates] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setIsCalendarOpen(false); // Close popover on selection
    }
  };

  useEffect(() => {
    setMounted(true);
    setDate(new Date());
  }, []);

  useEffect(() => {
    if (!date) return;

    const loadWorkouts = async () => {
      setLoading(true);
      try {
        const data = await fetchWorkoutsForDate(date);
        setWorkouts(data);
      } catch (error) {
        console.error("Error fetching workouts:", error);
        setWorkouts([]);
      }
      setLoading(false);
    };

    loadWorkouts();
  }, [date]);

  useEffect(() => {
    const loadWorkoutDates = async () => {
      try {
        const dates = await fetchWorkoutDatesForMonth(currentMonth);
        setWorkoutDates(dates);
      } catch (error) {
        console.error("Error fetching workout dates:", error);
        setWorkoutDates([]);
      }
    };

    loadWorkoutDates();
  }, [currentMonth]);

  if (!mounted) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold">Workout Log</h1>
              <p className="text-muted-foreground">
                View and track your workouts by date
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/workout/new">
                <Plus className="mr-2 h-4 w-4" />
                New Workout
              </Link>
            </Button>
          </div>
          <div className="h-[300px] w-full rounded-md border border-input bg-background" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">Workout Log</h1>
            <p className="text-muted-foreground">
              View and track your workouts by date
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/workout/new">
              <Plus className="mr-2 h-4 w-4" />
              New Workout
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Calendar Popover */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "do MMM yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                onMonthChange={setCurrentMonth}
                initialFocus
                modifiers={{
                  hasWorkout: workoutDates,
                }}
                modifiersClassNames={{
                  hasWorkout: "has-workout",
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Selected Date Header */}
          <h2 className="text-xl font-semibold">
            Workouts for {date ? format(date, "do MMM yyyy") : ""}
          </h2>

          {/* Workout List */}
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : workouts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No workouts logged for this date
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {workouts.map((workout) => (
                <Link
                  key={workout.id}
                  href={`/dashboard/workout/${workout.id}`}
                  className="transition-opacity hover:opacity-80"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">{workout.name}</CardTitle>
                      <CardDescription>
                        {workout.exercises.length} exercise
                        {workout.exercises.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                      {workout.exercises.map((exercise) => (
                        <div key={exercise.id} className="flex flex-col gap-2">
                          <h4 className="font-medium">{exercise.name}</h4>
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
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
