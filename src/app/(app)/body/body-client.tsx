"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Scale, Plus } from "lucide-react";
import {
  Button,
  Input,
  Label,
  SectionCards,
  EmptyState,
  Spinner,
  type KpiCard,
} from "@takaki/go-design-system";
import { PageShell } from "@/components/layout/page-shell";
import { MetricChart } from "@/components/ui/metric-chart";
import { todayStr, toLocalIso } from "@/lib/date-utils";
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

  const [dateInput, setDateInput] = useState(todayStr());
  const [weightInput, setWeightInput] = useState("");
  const [bodyFatInput, setBodyFatInput] = useState("");
  const [loading, setLoading] = useState(false);

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
            icon: <Scale className="w-4 h-4" />,
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

  return (
    <PageShell title="ボディ" icon={<Scale className="w-6 h-6" />}>
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
                <MetricChart
                  data={chartData.filter((d) => d.weight != null)}
                  config={{
                    weight: {
                      label: "体重(kg)",
                      color: "var(--color-primary)",
                    },
                  }}
                  xKey="date"
                  yKey="weight"
                  yUnit="kg"
                  title="体重推移"
                  xTickFormatter={(v) => format(new Date(v), "M/d")}
                  tooltipLabelFormatter={(v) =>
                    format(new Date(v), "M月d日", { locale: ja })
                  }
                />
              )}
            {chartData.some((d) => d.bodyFat != null) &&
              chartData.length > 1 && (
                <MetricChart
                  data={chartData.filter((d) => d.bodyFat != null)}
                  config={{
                    bodyFat: {
                      label: "体脂肪率(%)",
                      color: "var(--color-exercise-pullup)",
                    },
                  }}
                  xKey="date"
                  yKey="bodyFat"
                  yUnit="%"
                  title="体脂肪率推移"
                  xTickFormatter={(v) => format(new Date(v), "M/d")}
                  tooltipLabelFormatter={(v) =>
                    format(new Date(v), "M月d日", { locale: ja })
                  }
                />
              )}
          </div>
        </>
      )}
    </PageShell>
  );
}
