"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
  Dumbbell,
  Star,
  ChevronDown,
  ChevronUp,
  Trophy,
  ArrowUpToLine,
  Zap,
  History,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import {
  PageHeader,
  Banner,
  Timeline,
  Section,
  ChartArea,
  EmptyState,
  Spinner,
  type TimelineItem,
} from "@takaki/go-design-system";
import type { Exercise, PersonalRecord } from "@/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const ConfettiComponent = dynamic(() => import("./confetti"), { ssr: false });

interface Props {
  exercises: Exercise[];
  personalRecords: PersonalRecord[];
  userId: string;
}

const EXERCISE_META: Record<
  string,
  { icon: React.ElementType; colorVar: string }
> = {
  half_deadlift: { icon: Dumbbell, colorVar: "var(--color-exercise-deadlift)" },
  pull_up: { icon: ArrowUpToLine, colorVar: "var(--color-exercise-pullup)" },
  bench_press: { icon: Zap, colorVar: "var(--color-exercise-benchpress)" },
};

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}
function toLocalIso(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

export function RecordClient({ exercises, personalRecords, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [recordDate, setRecordDate] = useState(todayStr());
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prResult, setPrResult] = useState<{
    isPR: boolean;
    prevValue?: number;
    newValue: number;
    exerciseName: string;
  } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const getExerciseRecords = useCallback(
    (exerciseId: string) =>
      personalRecords.filter((r) => r.exercise_id === exerciseId),
    [personalRecords],
  );

  const getLatestPR = useCallback(
    (exerciseId: string, isPullUp: boolean) => {
      const records = getExerciseRecords(exerciseId);
      if (records.length === 0) return null;
      return isPullUp
        ? Math.max(...records.map((r) => r.reps ?? 0))
        : Math.max(...records.map((r) => r.weight_kg ?? 0));
    },
    [getExerciseRecords],
  );

  const handleSubmit = async () => {
    if (!selectedExercise) return;
    const isPullUp = selectedExercise.name === "pull_up";
    const value = isPullUp ? Number(repsInput) : Number(weightInput);
    if (!value || value <= 0) {
      toast.error("値を入力してください");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/record/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercise_id: selectedExercise.id,
          exercise_name: selectedExercise.name,
          weight_kg: isPullUp ? null : value,
          reps: isPullUp ? value : null,
          record_type: isPullUp ? "max_reps" : "weight_5rep",
          recorded_at: toLocalIso(recordDate),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const prevBest = getLatestPR(selectedExercise.id, isPullUp);
      setPrResult({
        isPR: data.is_pr,
        prevValue: prevBest ?? undefined,
        newValue: value,
        exerciseName: selectedExercise.name_ja,
      });
      if (data.is_pr) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
      }
      setWeightInput("");
      setRepsInput("");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "記録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (r: PersonalRecord) => {
    setEditingId(r.id);
    setEditDate(format(new Date(r.recorded_at), "yyyy-MM-dd"));
    setEditWeight(r.weight_kg?.toString() ?? "");
    setEditReps(r.reps?.toString() ?? "");
  };

  const handleUpdate = async (isPullUp: boolean) => {
    if (!editingId) return;
    const value = isPullUp ? Number(editReps) : Number(editWeight);
    if (!value || value <= 0) {
      toast.error("値を入力してください");
      return;
    }
    setEditLoading(true);
    try {
      const { error } = await supabase
        .schema("physicalgo")
        .from("personal_records")
        .update({
          weight_kg: isPullUp ? null : value,
          reps: isPullUp ? value : null,
          recorded_at: toLocalIso(editDate),
        })
        .eq("id", editingId);
      if (error) throw error;
      toast.success("更新しました");
      setEditingId(null);
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "更新に失敗しました");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    toast("この記録を削除しますか？", {
      action: {
        label: "削除する",
        onClick: async () => {
          const { error } = await supabase
            .schema("physicalgo")
            .from("personal_records")
            .delete()
            .eq("id", id);
          if (error) {
            toast.error("削除に失敗しました");
            return;
          }
          toast.success("削除しました");
          router.refresh();
        },
      },
      cancel: { label: "キャンセル", onClick: () => {} },
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {showConfetti && <ConfettiComponent />}

      <PageHeader
        title="自己ベスト記録"
        description="種目を選んで記録を残そう"
      />

      {prResult && (
        <Banner
          variant={prResult.isPR ? "success" : "info"}
          title={prResult.isPR ? "自己ベスト更新！" : "今日も積み上げた"}
          description={
            prResult.isPR && prResult.prevValue
              ? `${prResult.prevValue}${prResult.exerciseName === "懸垂" ? "回" : "kg"} → ${prResult.newValue}${prResult.exerciseName === "懸垂" ? "回" : "kg"}`
              : prResult.isPR
                ? `${prResult.newValue}${prResult.exerciseName === "懸垂" ? "回" : "kg"} で記録開始`
                : undefined
          }
          dismissible
          onDismiss={() => setPrResult(null)}
        />
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Exercise selection + form */}
        <div className="md:col-span-1 space-y-4">
          <Section title="種目を選択" variant="default">
            <div className="space-y-2 pt-2">
              {exercises.map((ex) => {
                const isPullUp = ex.name === "pull_up";
                const latestPR = getLatestPR(ex.id, isPullUp);
                const isSelected = selectedExercise?.id === ex.id;
                const meta =
                  EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift;
                const Icon = meta.icon;
                return (
                  <button
                    key={ex.id}
                    onClick={() => {
                      setSelectedExercise(isSelected ? null : ex);
                      setPrResult(null);
                    }}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: meta.colorVar }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ex.name_ja}</p>
                      {latestPR !== null && (
                        <p className="text-xs text-muted-foreground">
                          現在 {latestPR}
                          {isPullUp ? "回" : "kg"}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          {selectedExercise &&
            (() => {
              const isPullUp = selectedExercise.name === "pull_up";
              const meta =
                EXERCISE_META[selectedExercise.name] ??
                EXERCISE_META.half_deadlift;
              const Icon = meta.icon;
              return (
                <Card className="border-primary/30 animate-in fade-in">
                  <CardHeader className="pb-3 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Icon
                        className="w-4 h-4"
                        style={{ color: meta.colorVar }}
                      />
                      {selectedExercise.name_ja} を記録
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="recordDate" className="text-xs">
                        記録日
                      </Label>
                      <Input
                        id="recordDate"
                        type="date"
                        value={recordDate}
                        onChange={(e) => setRecordDate(e.target.value)}
                        className="h-10"
                        max={todayStr()}
                      />
                    </div>
                    {isPullUp ? (
                      <div className="space-y-1.5">
                        <Label htmlFor="reps" className="text-xs">
                          回数
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="reps"
                            type="number"
                            placeholder="例: 10"
                            value={repsInput}
                            onChange={(e) => setRepsInput(e.target.value)}
                            inputMode="numeric"
                            className="h-11 text-lg"
                          />
                          <span className="text-sm text-muted-foreground font-medium shrink-0">
                            回
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor="weight" className="text-xs">
                          重量（5回以上できた最大重量）
                        </Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="weight"
                            type="number"
                            placeholder="例: 80"
                            value={weightInput}
                            onChange={(e) => setWeightInput(e.target.value)}
                            inputMode="decimal"
                            className="h-11 text-lg"
                          />
                          <span className="text-sm text-muted-foreground font-medium shrink-0">
                            kg
                          </span>
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Spinner size="sm" />
                          記録中...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          記録する
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })()}
        </div>

        {/* Right: History */}
        <div className="md:col-span-2 space-y-5">
          {exercises.every((ex) => getExerciseRecords(ex.id).length === 0) ? (
            <EmptyState
              icon={<Trophy className="w-10 h-10" />}
              title="まだ記録がありません"
              description="左から種目を選んで最初の記録をしよう"
              className="py-16"
            />
          ) : (
            exercises.map((ex) => {
              const isPullUp = ex.name === "pull_up";
              const records = getExerciseRecords(ex.id);
              if (records.length === 0) return null;
              const meta =
                EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift;
              const Icon = meta.icon;

              const chartData = records
                .slice()
                .sort(
                  (a, b) =>
                    new Date(a.recorded_at).getTime() -
                    new Date(b.recorded_at).getTime(),
                )
                .map((r) => ({
                  date: r.recorded_at,
                  value: Number(isPullUp ? r.reps : r.weight_kg) || 0,
                }));

              const timelineItems: TimelineItem[] = records
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.recorded_at).getTime() -
                    new Date(a.recorded_at).getTime(),
                )
                .map((r) => ({
                  id: r.id,
                  title: isPullUp ? `${r.reps}回` : `${r.weight_kg}kg`,
                  timestamp: format(new Date(r.recorded_at), "M月d日(E)", {
                    locale: ja,
                  }),
                  variant: r.is_pr ? "success" : "default",
                  icon: r.is_pr ? <Star className="w-3 h-3" /> : undefined,
                  description:
                    editingId === r.id ? (
                      <div className="space-y-2 mt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">記録日</Label>
                            <Input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="h-8 text-sm"
                              max={todayStr()}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">
                              {isPullUp ? "回数" : "重量(kg)"}
                            </Label>
                            {isPullUp ? (
                              <Input
                                type="number"
                                value={editReps}
                                onChange={(e) => setEditReps(e.target.value)}
                                inputMode="numeric"
                                className="h-8 text-sm"
                              />
                            ) : (
                              <Input
                                type="number"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                inputMode="decimal"
                                className="h-8 text-sm"
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleUpdate(isPullUp)}
                            disabled={editLoading}
                          >
                            {editLoading ? (
                              <>
                                <Spinner size="sm" />
                                更新中...
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3" />
                                保存
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-1 mt-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground"
                          onClick={() => startEdit(r)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(r.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ),
                }));

              return (
                <Section
                  key={ex.id}
                  title={ex.name_ja}
                  description={`${records.length}件の記録`}
                  variant="bordered"
                >
                  <div className="space-y-4 pt-3">
                    {chartData.length > 1 && (
                      <ChartArea
                        data={chartData}
                        config={{
                          value: {
                            label: isPullUp ? "回数" : "重量(kg)",
                            color: meta.colorVar,
                          },
                        }}
                        xKey="date"
                        yKeys={["value"]}
                        filterByDate={false}
                        xTickFormatter={(v) => format(new Date(v), "M/d")}
                        tooltipLabelFormatter={(v) =>
                          format(new Date(v), "M月d日", { locale: ja })
                        }
                      />
                    )}
                    <Timeline items={timelineItems} />
                  </div>
                </Section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
