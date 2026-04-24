import { Dumbbell, ArrowUpToLine, Zap } from "lucide-react";
import type { ElementType } from "react";

export const EXERCISE_NAMES = {
  HALF_DEADLIFT: "half_deadlift",
  PULL_UP: "pull_up",
  BENCH_PRESS: "bench_press",
} as const;

export type ExerciseName = (typeof EXERCISE_NAMES)[keyof typeof EXERCISE_NAMES];

export const EXERCISE_META: Record<
  string,
  { icon: ElementType; colorVar: string }
> = {
  [EXERCISE_NAMES.HALF_DEADLIFT]: {
    icon: Dumbbell,
    colorVar: "var(--color-exercise-deadlift)",
  },
  [EXERCISE_NAMES.PULL_UP]: {
    icon: ArrowUpToLine,
    colorVar: "var(--color-exercise-pullup)",
  },
  [EXERCISE_NAMES.BENCH_PRESS]: {
    icon: Zap,
    colorVar: "var(--color-exercise-benchpress)",
  },
};
