"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  Scale,
  Plus,
  Camera,
  X,
  Pencil,
  Trash2,
  Check,
  ImageIcon,
} from "lucide-react";
import {
  PageHeader,
  SectionCards,
  ChartArea,
  Section,
  Timeline,
  EmptyState,
  Spinner,
  Button,
  Input,
  type KpiCard,
  type TimelineItem,
} from "@takaki/go-design-system";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { BodyRecord } from "@/types";

interface Props {
  bodyRecords: BodyRecord[];
  userId: string;
}

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}
function toLocalIso(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

export function BodyClient({ bodyRecords, userId }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [showForm, setShowForm] = useState(false);
  const [dateInput, setDateInput] = useState(todayStr());
  const [weightInput, setWeightInput] = useState("");
  const [bodyFatInput, setBodyFatInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editFat, setEditFat] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const latest = bodyRecords[bodyRecords.length - 1];
  const prev = bodyRecords[bodyRecords.length - 2];
  const weightDiff =
    latest?.weight_kg && prev?.weight_kg
      ? latest.weight_kg - prev.weight_kg
      : null;
  const fatDiff =
    latest?.body_fat_pct && prev?.body_fat_pct
      ? latest.body_fat_pct - prev.body_fat_pct
      : null;

  const chartData = bodyRecords.map((r) => ({
    date: r.recorded_at,
    weight: r.weight_kg ?? undefined,
    bodyFat: r.body_fat_pct ?? undefined,
  }));

  const kpiCards: KpiCard[] = [
    ...(latest?.weight_kg != null
      ? [
          {
            title: "体重",
            value: `${latest.weight_kg}kg`,
            description: "最新記録",
            trend:
              weightDiff !== null
                ? {
                    direction: (weightDiff < 0 ? "down" : "up") as
                      | "up"
                      | "down",
                    value: `${weightDiff > 0 ? "+" : ""}${weightDiff.toFixed(1)}kg`,
                  }
                : undefined,
          },
        ]
      : []),
    ...(latest?.body_fat_pct != null
      ? [
          {
            title: "体脂肪率",
            value: `${latest.body_fat_pct}%`,
            description: "最新記録",
            trend:
              fatDiff !== null
                ? {
                    direction: (fatDiff < 0 ? "down" : "up") as "up" | "down",
                    value: `${fatDiff > 0 ? "+" : ""}${fatDiff.toFixed(1)}%`,
                  }
                : undefined,
          },
        ]
      : []),
    {
      title: "記録数",
      value: bodyRecords.length,
      description: "累計記録件数",
    },
    ...(latest
      ? [
          {
            title: "最終記録",
            value: format(new Date(latest.recorded_at), "M月d日", {
              locale: ja,
            }),
            description: "最終記録日",
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
      let photoUrl: string | null = null;
      if (photoFile) {
        const path = `${userId}/body/${Date.now()}-${photoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("physicalgo")
          .upload(path, photoFile);
        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("physicalgo").getPublicUrl(path);
          photoUrl = publicUrl;
        }
      }
      const { error } = await supabase
        .schema("physicalgo")
        .from("body_records")
        .insert({
          user_id: userId,
          weight_kg: weightInput ? Number(weightInput) : null,
          body_fat_pct: bodyFatInput ? Number(bodyFatInput) : null,
          note: noteInput || null,
          photo_url: photoUrl,
          recorded_at: toLocalIso(dateInput),
        });
      if (error) throw error;
      toast.success("記録しました");
      setShowForm(false);
      setDateInput(todayStr());
      setWeightInput("");
      setBodyFatInput("");
      setNoteInput("");
      setPhotoFile(null);
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
    setEditNote(r.note ?? "");
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
          note: editNote || null,
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

  const handleDelete = async (id: string) => {
    toast("この記録を削除しますか？", {
      action: {
        label: "削除する",
        onClick: async () => {
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
        },
      },
      cancel: { label: "キャンセル", onClick: () => {} },
    });
  };

  const timelineItems: TimelineItem[] = [...bodyRecords].reverse().map((r) => ({
    id: r.id,
    title:
      [
        r.weight_kg != null && `${r.weight_kg}kg`,
        r.body_fat_pct != null && `${r.body_fat_pct}%`,
      ]
        .filter(Boolean)
        .join(" · ") || "記録あり",
    timestamp: format(new Date(r.recorded_at), "M月d日(E)", { locale: ja }),
    description:
      editingId === r.id ? (
        <div className="space-y-2 mt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">記録日</Label>
            <Input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="h-8 text-sm"
              max={todayStr()}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">体重(kg)</Label>
              <Input
                type="number"
                placeholder="kg"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                inputMode="decimal"
                className="h-8 text-sm"
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
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">メモ</Label>
            <Input
              placeholder="メモ（任意）"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setEditingId(null)}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs"
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
        <div className="flex items-center gap-2 mt-1">
          {r.note && (
            <span className="text-xs text-muted-foreground">{r.note}</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground"
            onClick={() => startEdit(r)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => handleDelete(r.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="ボディデータ"
        description="体重・体脂肪率の定点観測"
        actions={
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            記録する
          </Button>
        }
      />

      {bodyRecords.length > 0 && <SectionCards cards={kpiCards} />}

      {showForm && (
        <Card className="border-primary/30 animate-in fade-in slide-in-from-top-2">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-primary" />
                新規記録
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
                className="w-7 h-7 text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="date" className="text-xs">
                記録日
              </Label>
              <Input
                id="date"
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="h-10"
                max={todayStr()}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="weight" className="text-xs">
                  体重 (kg)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="例: 72.0"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  inputMode="decimal"
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bodyFat" className="text-xs">
                  体脂肪率 (%)
                </Label>
                <Input
                  id="bodyFat"
                  type="number"
                  placeholder="例: 22.0"
                  value={bodyFatInput}
                  onChange={(e) => setBodyFatInput(e.target.value)}
                  inputMode="decimal"
                  className="h-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs">
                メモ（任意）
              </Label>
              <Input
                id="note"
                placeholder="体調など"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="h-10"