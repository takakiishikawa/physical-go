"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Scale, Plus, X, Pencil, Trash2, Check } from "lucide-react";
import {
  SectionCards,
  ChartArea,
  Section,
  EmptyState,
  Spinner,
  type KpiCard,
} from "@takaki/go-design-system";
import { PageShell } from "@/components/layout/page-shell";
import { todayStr, toLocalIso } from "@/lib/date-utils";
import { useDeleteConfirm } from "@/hooks/use-delete-confirm";
import { subDays, format } from "date-fns";
import { ja } from "date-fns/locale";
import type { BodyRecord } from "@/types";

interface Props {
  bodyRecords: BodyRecord[];
  userId: string;
}

export function BodyClient({ bodyRecords, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const { confirmDelete } = useDeleteConfirm();

  const [dateInput, setDateInput] = useState(todayStr());
  const [weightInput, setWeightInput] = useState("");
  const [bodyFatInput, setBodyFatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editFat, setEditFat] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const oneMonthAgo = useMemo(() => subDays(new Date(), 30), []);

  const sorted = useMemo(
    () =>
      [...bodyRecords].sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
      ),
    [bodyRecords],
  );

  const chartData = sorted.map((r) => ({
    date: r.recorded_at,
    weight: r.weight_kg ?? undefined,
    bodyFat: r.body_fat_pct ?? undefined,
  }));

  const latestWeight = sorted.filter((r) => r.weight_kg != null).at(-1);
  const latestFat = sorted.filter((r) => r.body_fat_pct != null).at(-1);
  const oldWeight = sorted
    .filter(
      (r) => r.weight_kg != null && new Date(r.recorded_at) <= oneMonthAgo,
    )
    .at(-1);
  const oldFat = sorted
    .filter(
      (r) => r.body_fat_pct != null && new Date(r.recorded_at) <= oneMonthAgo,
    )
    .at(-1);

  const kpiCards: KpiCard[] = [
    ...(latestWeight?.weight_kg != null
      ? [
          {
            title: "体重",
            value: `${latestWeight.weight_kg}kg`,
            description:
              oldWeight?.weight_kg != null
                ? `1ヶ月前: ${oldWeight.weight_kg}kg`
                : "比較データなし",
            icon: <Scale className="w-4 h-4" />,
            trend:
              oldWeight?.weight_kg != null
                ? (() => {
                    const diff = latestWeight.weight_kg! - oldWeight.weight_kg!;
                    const sign = diff > 0 ? "+" : "";
                    return {
                      direction: (diff < 0
                        ? "up"
                        : diff > 0
                          ? "down"
                          : "neutral") as "up" | "down" | "neutral",
                      value: `${sign}${diff.toFixed(1)}kg`,
                    };
                  })()
                : undefined,
          },
        ]
      : []),
    ...(latestFat?.body_fat_pct != null
      ? [
          {
            title: "体脂肪率",
            value: `${latestFat.body_fat_pct}%`,
            description:
              oldFat?.body_fat_pct != null
                ? `1ヶ月前: ${oldFat.body_fat_pct}%`
                : "比較データなし",
            trend:
              oldFat?.body_fat_pct != null
                ? (() => {
                    const diff = latestFat.body_fat_pct! - oldFat.body_fat_pct!;
                    const sign = diff > 0 ? "+" : "";
                    return {
                      direction: (diff < 0
                        ? "up"
                        : diff > 0
                          ? "down"
                          : "neutral") as "up" | "down" | "neutral",
                      value: `${sign}${diff.toFixed(1)}%`,
                    };
                  })()
                : undefined,
          },
        ]
      : []),
  ];

  const handleSubmit = async () => {
    if (!weightInput && !bodyFatInput) {
      toast.error("体重または体脂肪率を入力してください");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .schema("physicalgo")
        .from("body_records")
        .insert({
          user_id: userId,
          weight_kg: weightInput ? Number(weightInput) : null,
          body_fat_pct: bodyFatInput ? Number(bodyFatInput) : null,
          recorded_at: toLocalIso(dateInput),
        });
      if (error) throw error;
      toast.success("記録しました");
      setWeightInput("");
      setBodyFatInput("");
      setDateInput(todayStr());
      router.refresh();
    } catch (e: any) {
      toast.error(e.message ?? "記録に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (r: BodyRecord) => {
    setEditingId(r.id);
    setEditDate(format(new Date(r.recorded_at), "yyyy-MM-dd"));
    setEditWeight(r.weight_kg?.toString() ?? "");
    setEditFat(r.body_fat_pct?.toString() ?? "");
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!editWeight && !editFat) {
      toast.error("体重または体脂肪率を入力してください");
      return;
    }
    setEditLoading(true);
    try {
      const { error } = await supabase
        .schema("physicalgo")
        .from("body_records")
        .update({
          weight_kg: editWeight ? Number(editWeight) : null,
          body_fat_pct: editFat ? Number(editFat) : null,
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
    setEditLoading(true);
    try {
      const { error } = await supabase
        .schema("physicalgo")
        .from("body_records")
        .update({
          weight_kg: editWeight ? Number(editWeight) : null,
          body_fat_pct: editFat ? Number(editFat) : null,
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
    confirmDelete(async () => {
      const { error } = await supabase
        .schema("physicalgo")
        .from("body_records")
        .delete()
        .eq("id", id);
      if (error) {
        toast.error("削除に失敗しました");
        return;
      }
      toast.success("削除しました");
      router.refresh();
    });
  };

  return (
    <PageShell title="ボディ">
      {/* Inline add form */}
      <div className="bg-muted/40 rounded-lg border border-border p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">記録日</Label>
            <Input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="h-9 w-36"
              max={todayStr()}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">体重 (kg)</Label>
            <Input
              type="number"
              placeholder="例: 72.0"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              inputMode="decimal"
              className="h-9 w-28"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              体脂肪率 (%)
            </Label>
            <Input
              type="number"
              placeholder="例: 22.0"
              value={bodyFatInput}
              onChange={(e) => setBodyFatInput(e.target.value)}
              inputMode="decimal"
              className="h-9 w-28"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            size="sm"
            className="gap-1.5 h-9"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                記録中...
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                記録する
              </>
            )}
          </Button>
        </div>
      </div>

      {bodyRecords.length === 0 ? (
        <EmptyState
          icon={<Scale className="w-10 h-10" />}
          title="まだ記録がありません"
          description="体重・体脂肪率を継続的に記録しよう"
        />
      ) : (
        <>
          {kpiCards.length > 0 && <SectionCards cards={kpiCards} />}

          <div className="space-y-6">
            {chartData.some((d) => d.weight != null) &&
              chartData.length > 1 && (
                <ChartArea
                  data={chartData.filter((d) => d.weight != null)}
                  config={{
                    weight: {
                      label: "体重(kg)",
                      color: "var(--color-primary)",
                    },
                  }}
                  xKey="date"
                  yKeys={["weight"]}
                  title="体重推移"
                  filterByDate={false}
                  xTickFormatter={(v) => format(new Date(v), "M/d")}
                  tooltipLabelFormatter={(v) =>
                    format(new Date(v), "M月d日", { locale: ja })
                  }
                />
              )}
            {chartData.some((d) => d.bodyFat != null) &&
              chartData.length > 1 && (
                <ChartArea
                  data={chartData.filter((d) => d.bodyFat != null)}
                  config={{
                    bodyFat: {
                      label: "体脂肪率(%)",
                      color: "var(--color-exercise-pullup)",
                    },
                  }}
                  xKey="date"
                  yKeys={["bodyFat"]}
                  title="体脂肪率推移"
                  filterByDate={false}
                  xTickFormatter={(v) => format(new Date(v), "M/d")}
                  tooltipLabelFormatter={(v) =>
                    format(new Date(v), "M月d日", { locale: ja })
                  }
                />
              )}

            <Section
              title="記録"
              description={`${bodyRecords.length}件`}
              variant="bordered"
            >
              <div className="divide-y divide-border">
                {[...sorted].reverse().map((r) => (
                  <div key={r.id}>
                    {editingId === r.id ? (
                      <div className="py-3 space-y-3">
                        <div className="flex flex-wrap gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">記録日</Label>
                            <Input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="h-8 w-36 text-sm"
                              max={todayStr()}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">体重(kg)</Label>
                            <Input
                              type="number"
                              placeholder="kg"
                              value={editWeight}
                              onChange={(e) => setEditWeight(e.target.value)}
                              inputMode="decimal"
                              className="h-8 w-24 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">体脂肪率(%)</Label>
                            <Input
                              type="number"
                              placeholder="%"
                              value={editFat}
                              onChange={(e) => setEditFat(e.target.value)}
                              inputMode="decimal"
                              className="h-8 w-24 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            キャンセル
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={handleUpdate}
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
                      <div className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-medium tabular-nums">
                            {[
                              r.weight_kg != null && `${r.weight_kg}kg`,
                              r.body_fat_pct != null && `${r.body_fat_pct}%`,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(r.recorded_at), "M/d(E)", {
                              locale: ja,
                            })}
                          </span>
                        </div>
                        <div className="flex gap-0.5">
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
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </>
      )}
    </PageShell>
  );
}
