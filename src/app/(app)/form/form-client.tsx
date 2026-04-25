"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Camera,
  Upload,
  Play,
  CheckCircle2,
  X,
  Video,
  Sparkles,
  Trash2,
  Activity,
} from "lucide-react";
import {
  Button,
  Section,
  EmptyState,
  Spinner,
  Banner,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast,
} from "@takaki/go-design-system";
import { PageShell } from "@/components/layout/page-shell";
import { createClient } from "@/lib/supabase/client";
import type { FormSession } from "@/types";
import { EXERCISE_META } from "@/lib/exercise-meta";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { extractFramesFromVideo } from "@/lib/extract-frames";

const MAX_VIDEO_SIZE_MB = 50;

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
  const [progress, setProgress] = useState(0);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      toast.error(`動画サイズが大きすぎます（${MAX_VIDEO_SIZE_MB}MBまで）`);
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const clearVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
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
    setProgress(5);
    setLoadingStep("動画から特徴フレームを抽出中...");
    try {
      const frames = await extractFramesFromVideo(videoFile, { count: 6 });
      setProgress(30);

      setLoadingStep("動画をクラウドに保存中...");
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("ログインが必要です");

      const safeName = videoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const videoPath = `${user.id}/videos/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("physicalgo")
        .upload(videoPath, videoFile, {
          contentType: videoFile.type,
          upsert: false,
        });
      if (uploadError) {
        throw new Error(`アップロードに失敗しました: ${uploadError.message}`);
      }
      const {
        data: { publicUrl: videoUrl },
      } = supabase.storage.from("physicalgo").getPublicUrl(videoPath);
      setProgress(55);

      setLoadingStep("Claude Opus がフォームを分析中...");
      const res = await fetch("/api/form/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoPath,
          videoUrl,
          fileName: videoFile.name,
          fileSize: videoFile.size,
          frames,
        }),
      });
      setProgress(90);

      const text = await res.text();
      let data: { session_id?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          res.status === 413
            ? "ファイルが大きすぎます"
            : `サーバーエラー (${res.status})`,
        );
      }
      if (!res.ok || !data.session_id)
        throw new Error(data.error ?? "解析に失敗しました");

      setProgress(100);
      toast.success("フォーム解析完了");
      router.push(`/form/${data.session_id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "解析に失敗しました");
    } finally {
      setLoading(false);
      setLoadingStep("");
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/form/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "削除に失敗しました");
      }
      toast.success("削除しました");
      setDeleteTargetId(null);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageShell
      title="フォーム"
      icon={<Video className="w-6 h-6" />}
      description="動画をアップすると Claude Opus 4.7 がフォームを多角的に分析します"
    >
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hero upload card */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-primary)_0%,transparent_50%)] opacity-[0.07] pointer-events-none" />
        <div className="relative p-5 md:p-8">
          {videoPreview ? (
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video shadow-lg">
                <video
                  src={videoPreview}
                  className="w-full h-full object-contain"
                  controls
                  muted
                  playsInline
                />
                {!loading && (
                  <button
                    onClick={clearVideo}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/70 backdrop-blur rounded-full flex items-center justify-center hover:bg-black/90 transition-colors"
                    aria-label="動画を削除"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    <span className="truncate">{videoFile?.name}</span>
                  </div>
                  <h2 className="text-lg font-semibold">解析の準備完了</h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    動画から複数フレームを抽出し、Claude Opus
                    4.7が関節角度・バー軌道・テンポを総合評価します。
                  </p>
                </div>
                {loading ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Spinner size="sm" />
                      <span>{loadingStep}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleAnalyze} className="gap-2 flex-1">
                      <Sparkles className="w-4 h-4" />
                      AI でフォームを解析する
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearVideo}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      別の動画を選ぶ
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">フォームチェック</h2>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    側面から全身が映る動画（5〜30秒推奨）を撮影またはアップロードしてください。
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  onClick={() => {
                    if (fileRef.current) {
                      fileRef.current.setAttribute("capture", "environment");
                      fileRef.current.click();
                    }
                  }}
                  className="group flex flex-col items-center gap-2.5 p-5 rounded-lg border border-dashed border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <Camera className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-medium">今すぐ撮影</span>
                </button>
                <button
                  onClick={() => {
                    if (fileRef.current) {
                      fileRef.current.removeAttribute("capture");
                      fileRef.current.click();
                    }
                  }}
                  className="group flex flex-col items-center gap-2.5 p-5 rounded-lg border border-dashed border-border bg-card hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-sm font-medium">ライブラリから</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tips banner */}
      {!videoPreview && (
        <Banner
          variant="info"
          title="より精度の高い分析のために"
          description="① 三脚や安定した場所から側面を撮影　② 全身（頭〜足先）を画角に収める　③ 1〜2レップを通しで撮影"
          dismissible={false}
        />
      )}

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
                <div key={session.id} className="group relative">
                  <Link href={`/form/${session.id}`}>
                    <div className="rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all bg-card">
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
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteTargetId(session.id);
                    }}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive transition-all"
                    aria-label="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>このフォームチェックを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              動画とフィードバックがすべて削除されます。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "削除中..." : "削除する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* keep Play import reachable for tree-shaking parity */}
      <Play className="hidden" aria-hidden />
    </PageShell>
  );
}
