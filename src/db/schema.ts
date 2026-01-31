import {
  pgTable,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  real,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// USERS TABLE
// ============================================================================
export const users = pgTable('users', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  clerkId: varchar('clerk_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  workouts: many(workouts),
  createdExercises: many(exercises),
}));

// ============================================================================
// EXERCISES TABLE (Master Library)
// ============================================================================
export const exercises = pgTable('exercises', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  muscleGroup: varchar('muscle_group', { length: 100 }),
  equipment: varchar('equipment', { length: 100 }),
  instructions: text('instructions'),
  imageUrl: text('image_url'),
  videoUrl: text('video_url'),
  isSystemExercise: boolean('is_system_exercise').default(false),
  createdByUserId: integer('created_by_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [exercises.createdByUserId],
    references: [users.id],
  }),
  workoutExercises: many(workoutExercises),
}));

// ============================================================================
// WORKOUTS TABLE
// ============================================================================
export const workouts = pgTable('workouts', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 255 }),
  notes: text('notes'),
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationMinutes: integer('duration_minutes'),
  isTemplate: boolean('is_template').default(false),
  templateId: integer('template_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  template: one(workouts, {
    fields: [workouts.templateId],
    references: [workouts.id],
    relationName: 'templateWorkouts',
  }),
  workoutsFromTemplate: many(workouts, {
    relationName: 'templateWorkouts',
  }),
  workoutExercises: many(workoutExercises),
}));

// ============================================================================
// WORKOUT_EXERCISES TABLE (Junction Table)
// ============================================================================
export const workoutExercises = pgTable('workout_exercises', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  workoutId: integer('workout_id')
    .references(() => workouts.id, { onDelete: 'cascade' })
    .notNull(),
  exerciseId: integer('exercise_id')
    .references(() => exercises.id, { onDelete: 'restrict' })
    .notNull(),
  orderIndex: integer('order_index').notNull(),
  notes: text('notes'),
  restSeconds: integer('rest_seconds'),
  targetSets: integer('target_sets'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    exercise: one(exercises, {
      fields: [workoutExercises.exerciseId],
      references: [exercises.id],
    }),
    sets: many(sets),
  })
);

// ============================================================================
// SETS TABLE
// ============================================================================
export const sets = pgTable('sets', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  workoutExerciseId: integer('workout_exercise_id')
    .references(() => workoutExercises.id, { onDelete: 'cascade' })
    .notNull(),
  setNumber: integer('set_number').notNull(),
  setType: varchar('set_type', { length: 50 }),
  reps: integer('reps'),
  weight: real('weight'),
  weightUnit: varchar('weight_unit', { length: 10 }).default('kg'),
  durationSeconds: integer('duration_seconds'),
  distanceMeters: real('distance_meters'),
  rpe: real('rpe'),
  repsInReserve: integer('reps_in_reserve'),
  isCompleted: boolean('is_completed').default(false),
  isPersonalRecord: boolean('is_personal_record').default(false),
  notes: text('notes'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;

export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;
