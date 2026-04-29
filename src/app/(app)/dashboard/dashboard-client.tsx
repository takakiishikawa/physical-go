"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  SectionCards,
  Section,
  EmptyState,
  type KpiCard,
} from "@takaki/go-design-system";
import { Plus } from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import type { Exercise, PersonalRecord } from "@/types";
import { EXERCISE_META, EXERCISE_NAMES } from "@/lib/exercise-meta";
import { format, subDays } from "date-fns";
import { ja } from "date-fns/locale";

const MetricChart = dynamic(
  () =>
    import("@/components/charts/metric-chart").then((m) => ({
      default: m.MetricChart,
    })),
  { ssr: false },
);

const ConfettiComponent = dynamic(
  () => import("@/components/dashboard/confetti"),
  { ssr: false },
);

const ExerciseRecordDialog = dynamic(
  () =>
    import("@/components/dashboard/exercise-record-dialog").then((m) => ({
      default: m.ExerciseRecordDialog,
    })),
  { ssr: false },
);

interface Props {
  exercises: Exercise[];
  personalRecords: PersonalRecord[];
}

export function DashboardClient({ exercises, personalRecords }: Props) {
  const oneMonthAgo = useMemo(() => subDays(new Date(), 30), []);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const exerciseData = useMemo(() => {
    return exercises.map((ex) => {
      const isPullUp = ex.name === EXERCISE_NAMES.PULL_UP;
      const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift;

      const exerciseRecords = personalRecords.filter(
        (r) => r.exercise_id === ex.id,
      );

      const sorted = [...exerciseRecords].sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
      );

      const chartData = sorted
        .filter((r) => (isPullUp ? r.reps != null : r.weight_kg != null))
        .map((r) => ({
          date: r.recorded_at,
          value: Number(isPullUp ? r.reps : r.weight_kg),
        }));

      const currentVal = chartData.at(-1)?.value ?? null;
      const oldVal =
        [...chartData].filter((d) => new Date(d.date) <= oneMonthAgo).at(-1)
          ?.value ?? null;
      const unit = isPullUp ? "回" : "kg";

      return {
        exercise: ex,
        isPullUp,
        chartData,
        meta,
        currentVal,
        oldVal,
        unit,
        exerciseRecords,
      };
    });
  }, [exercises, personalRecords, oneMonthAgo]);

  const activeExercise = exerciseData.find(
    (d) => d.exercise.id === activeExerciseId,
  );

  const kpiCards: KpiCard[] = exerciseData.map(
    ({ exercise, currentVal, oldVal, unit, meta }) => {
      const Icon = meta.icon;
      return {
        title: exercise.name_ja,
        value: currentVal !== null ? `${currentVal}${unit}` : "未記録",
        description:
          oldVal !== null ? `1ヶ月前: ${oldVal}${unit}` : "比較データなし",
        icon: <Icon className="w-4 h-4" style={{ color: meta.colorVar }} />,
        actions: (
          <button
            type="button"
            onClick={() => setActiveExerciseId(exercise.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20 hover:bg-primary/90 hover:scale-105 transition-all"
            aria-label={`${exercise.name_ja} を記録`}
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        ),
      };
    },
  );

  return (
    <PageShell title="ダッシュボード">
      {showConfetti && <ConfettiComponent />}

      <SectionCards cards={kpiCards} />

      <div className="space-y-6">
        {exerciseData.map(({ exercise, isPullUp, chartData, meta }) =>
          chartData.length > 1 ? (
            <MetricChart
              key={exercise.id}
              title={exercise.name_ja}
              data={chartData}
              config={{
                value: {
                  label: isPullUp ? "回数" : "重量(kg)",
                  color: meta.colorVar,
                },
              }}
              xKey="date"
              yKey="value"
              yUnit={isPullUp ? "回" : "kg"}
              xTickFormatter={(v: string) => format(new Date(v), "M/d")}
              tooltipLabelFormatter={(v: string) =>
                format(new Date(v), "M月d日", { locale: ja })
              }
            />
          ) : (
            <Section
              key={exercise.id}
              title={exercise.name_ja}
              variant="bordered"
            >
              <EmptyState
                icon={
                  <meta.icon
                    className="w-8 h-8"
                    style={{ color: meta.colorVar }}
                  />
                }
                title="記録がありません"
                description="記録を追加するとグラフが表示されます"
                action={{
                  label: "記録する",
                  onClick: () => setActiveExerciseId(exercise.id),
                }}
              />
            </Section>
          ),
        )}
      </div>

      {activeExercise && (
        <ExerciseRecordDialog
          exercise={activeExercise.exercise}
          records={activeExercise.exerciseRecords}
          open={activeExerciseId !== null}
          onOpenChange={(open) => !open && setActiveExerciseId(null)}
          onPrCreated={() => {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);
          }}
        />
      )}
    </PageShell>
  );
}
