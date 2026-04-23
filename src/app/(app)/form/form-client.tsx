"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Camera,
  Upload,
  Play,
  CheckCircle2,
  Dumbbell,
  ArrowUpToLine,
  Zap,
  X,
  ListChecks,
} from "lucide-react";
import { PageHeader, Section, Banner, Spinner } from "@takaki/go-design-system";
import type { Exercise } from "@/types";

interface Props {
  exercises: Exercise[];
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

export function FormClient({ exercises }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [repsInput, setRepsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("動画ファイルを選択してください");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("ファイルサイズは100MB以下にしてください");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!selectedExercise) {
      toast.error("種目を選択してください");
      return;
    }
    if (!videoFile) {
      toast.error("動画を選択してください");
      return;
    }
    setLoading(true);
    setLoadingStep("動画をアップロード中...");
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("exercise_id", selectedExercise.id);
      formData.append("exercise_name", selectedExercise.name);
      if (weightInput) formData.append("weight_kg", weightInput);
      if (repsInput) formData.append("reps", repsInput);
      setLoadingStep("AIがフォームを解析中...");
      const res = await fetch("/api/form/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("フォームチェック完了");
      router.push(`/form/${data.session_id}`);
    } catch (e: any) {
      toast.error(e.message ?? "解析に失敗しました");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="フォームチェック"
        description="動画をアップロードするとAIがフォームを詳細に分析します"
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Upload + Settings */}
        <div className="space-y-5">
          <Section title="種目を選択" variant="default">
            <div className="grid grid-cols-3 gap-2 pt-2">
              {exercises.map((ex) => {
                const isSelected = selectedExercise?.id === ex.id;
                const meta =
                  EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift;
                const Icon = meta.icon;
                return (
                  <button
                    key={ex.id}
                    onClick={() => setSelectedExercise(isSelected ? null : ex)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: meta.colorVar }}
                    />
                    <p className="text-xs font-medium text-center leading-tight">
                      {ex.name_ja}
                    </p>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="動画をアップロード" variant="default">
            <div className="pt-2">
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              {videoPreview ? (
                <div className="space-y-2">
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                    <video
                      src={videoPreview}
                      className="w-full h-full object-contain"
                      controls
                      muted
                      playsInline
                    />
                    <button
                      onClick={() => {
                        setVideoFile(null);
                        setVideoPreview(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    {videoFile?.name}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (fileRef.current) {
                        fileRef.current.capture = "environment";
                        fileRef.current.click();
                      }
                    }}
                    className="flex flex-col items-center gap-2.5 p-5 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-all"
                  >
                    <Camera className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      今すぐ撮影
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      if (fileRef.current) {
                        fileRef.current.removeAttribute("capture");
                        fileRef.current.click();
                      }
                    }}
                    className="flex flex-col items-center gap-2.5 p-5 rounded-lg border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/30 transition-all"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      ギャラリーから
                    </span>
                  </button>
                </div>
              )}
            </div>
          </Section>

          {selectedExercise && (
            <div className="grid grid-cols-2 gap-3">
              {selectedExercise.name !== "pull_up" && (
                <div className="space-y-1.5">
                  <Label htmlFor="weight" className="text-xs">
                    重量 (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="例: 80"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    inputMode="decimal"
                    className="h-10"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="reps" className="text-xs">
                  回数
                </Label>
                <Input
                  id="reps"
                  type="number"
                  placeholder="例: 5"
                  value={repsInput}
                  onChange={(e) => setRepsInput(e.target.value)}
                  inputMode="numeric"
                  className="h-10"
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={loading || !selectedExercise || !videoFile}
            size="lg"
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                {loadingStep}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                AIでフォームを解析する
              </>
            )}
          </Button>
        </div>

        {/* Right: Guide + Checkpoints */}
        <div className="space-y-4">
          {selectedExercise ? (
            <>
              {selectedExercise.filming_guide && (
                <Banner
                  variant="info"
                  title="撮影ガイド"
                  description={selectedExercise.filming_guide}
                />
              )}

              {selectedExercise.key_checkpoints?.length > 0 && (
                <Section title="AIがチェックするポイント" variant="bordered">
                  <div className="space-y-2 pt-3">
                    {selectedExercise.key_checkpoints.map((cp, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 text-sm"
                      >
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary">
                            {i + 1}
                          </span>
                        </div>
                        <span>{cp}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              <Section title="解析内容" variant="default">
                <div className="space-y-1.5 pt-2">
                  {[
                    "フォームの強みと改善点",
                    "各チェックポイントの評価",
                    "前回との比較・成長の記録",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </Section>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                <Camera className="w-8 h-8 opacity-30" />
              </div>
              <p className="text-sm font-medium">種目を選択してください</p>
              <p className="text-xs">
                撮影ガイドとチェックポイントが表示されます
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
