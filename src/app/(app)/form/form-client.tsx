"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Play, CheckCircle2, X, Video } from "lucide-react";
import { Section, EmptyState, Spinner } from "@takaki/go-design-system";
import { PageShell } from "@/components/layout/page-shell";
import type { FormSession } from "@/types";
import { EXERCISE_META } from "@/lib/exercise-meta";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface Props {
  sessions: (FormSession & {
    exercises?: { name: string; name_ja: string } | null;
  })[];
  feedbacks: {
    session_id: string;
    overall_comment: string | null;
    created_at: string;
  }[];
}

export function FormClient({ sessions, feedbacks }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const feedbackMap = Object.fromEntries(
    feedbacks.map((f) => [f.session_id, f]),
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("動画ファイルを選択してください");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!videoFile) {
      toast.error("動画を選択してください");
      return;
    }
    setLoading(true);
    setLoadingStep("動画をアップロード中...");
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      setLoadingStep("AIがフォームを解析中...");
      const res = await fetch("/api/form/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("フォーム解析完了");
      router.push(`/form/${data.session_id}`);
    } catch (e: any) {
      toast.error(e.message ?? "解析に失敗しました");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  return (
    <PageShell title="フォーム">
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload area */}
      <div className="bg-muted/40 rounded-lg border border-border p-5 space-y-4">
        {videoPreview ? (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-lg">
              <video
                src={videoPreview}
                className="w-full h-full object-contain"
                controls
                muted
                playsInline
              />
              <button
                onClick={clearVideo}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                <span className="truncate max-w-48">{videoFile?.name}</span>
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="gap-2"
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
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              トレーニング動画をアップロードするとAIがフォームを解析します
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <button
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.setAttribute("capture", "environment");
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
                  ライブラリから
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      {sessions.length === 0 ? (
        <EmptyState
          icon={<Video className="w-10 h-10" />}
          title="まだフォームチェックがありません"
          description="動画を撮影してAIにフォームを解析してもらおう"
        />
      ) : (
        <Section
          title="過去のフォームチェック"
          description={`${sessions.length}件`}
          variant="bordered"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3">
            {sessions.map((session) => {
              const fb = feedbackMap[session.id];
              const exName = session.exercises?.name;
              const meta = exName ? EXERCISE_META[exName] : null;
              return (
                <Link key={session.id} href={`/form/${session.id}`}>
                  <div className="rounded-lg overflow-hidden border border-border hover:border-primary/40 hover:shadow-sm transition-all">
                    <div className="aspect-video bg-muted overflow-hidden">
                      {session.video_url ? (
                        <video
                          src={session.video_url}
                          className="w-full h-full object-cover pointer-events-none"
                          muted
                          playsInline
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {session.exercises?.name_ja && (
                          <span
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                            style={
                              meta
                                ? {
                                    color: meta.colorVar,
                                    borderColor: meta.colorVar + "40",
                                  }
                                : {}
                            }
                          >
                            {session.exercises.name_ja}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(session.recorded_at), "M月d日", {
                            locale: ja,
                          })}
                        </span>
                      </div>
                      {fb?.overall_comment && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {fb.overall_comment}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Section>
      )}
    </PageShell>
  );
}
