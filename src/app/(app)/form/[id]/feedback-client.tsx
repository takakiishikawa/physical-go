"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Video,
  Trash2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Button,
  Section,
  Tag,
  PageHeader,
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
import type {
  FormSession,
  FormFeedback,
  Exercise,
  ImprovementInput,
  ImprovementItem,
} from "@/types";

interface Props {
  session: FormSession & { exercises?: Exercise };
  feedback: FormFeedback | null;
  pastSessions: {
    id: string;
    recorded_at: string;
    weight_kg: number | null;
    reps: number | null;
    frame_url: string | null;
  }[];
}

const RESULT_CONFIG = {
  OK: {
    icon: CheckCircle2,
    label: "OK",
    bg: "bg-success/10",
    border: "border-success/30",
    text: "text-success",
    chip: "success" as const,
  },
  要改善: {
    icon: AlertTriangle,
    label: "要改善",
    bg: "bg-warning/10",
    border: "border-warning/30",
    text: "text-warning",
    chip: "warning" as const,
  },
  確認不可: {
    icon: HelpCircle,
    label: "確認不可",
    bg: "bg-muted",
    border: "border-border",
    text: "text-muted-foreground",
    chip: "default" as const,
  },
};

const SEVERITY_CONFIG = {
  high: {
    label: "重要",
    chip: "warning" as const,
    bg: "bg-warning/10",
    border: "border-warning/30",
    accent: "bg-warning",
  },
  medium: {
    label: "中",
    chip: "default" as const,
    bg: "bg-muted",
    border: "border-border",
    accent: "bg-primary/60",
  },
  low: {
    label: "微調整",
    chip: "default" as const,
    bg: "bg-muted/60",
    border: "border-border",
    accent: "bg-muted-foreground/40",
  },
};

function normalizeImprovement(item: ImprovementInput): ImprovementItem {
  if (typeof item === "string") {
    return { title: item, detail: "", severity: "medium" };
  }
  return {
    title: item.title ?? "",
    detail: item.detail ?? "",
    severity: item.severity ?? "medium",
  };
}

function ScoreRing({ score }: { score: number }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset =
    circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const color =
    score >= 85
      ? "var(--color-success)"
      : score >= 70
        ? "var(--color-primary)"
        : score >= 55
          ? "var(--color-warning)"
          : "var(--color-destructive)";
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96" aria-hidden>
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="8"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold leading-none">{score}</span>
        <span className="text-xs text-muted-foreground mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

export function FeedbackClient({ session, feedback, pastSessions }: Props) {
  const router = useRouter();
  const exercise = session.exercises;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const improvements = useMemo(
    () =>
      Array.isArray(feedback?.improvements)
        ? feedback!.improvements.map(normalizeImprovement)
        : [],
    [feedback],
  );
  const checkpoints = (feedback?.checkpoints ?? null) as Record<
    string,
    { result: string; comment: string }
  > | null;

  const checkpointEntries = checkpoints ? Object.entries(checkpoints) : [];
  const okCount = checkpointEntries.filter(
    ([, cp]) => cp.result === "OK",
  ).length;
  const improveCount = checkpointEntries.filter(
    ([, cp]) => cp.result === "要改善",
  ).length;
  const score =
    checkpointEntries.length > 0
      ? Math.round((okCount / checkpointEntries.length) * 100)
      : 0;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/form/${session.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? "削除に失敗しました");
      }
      toast.success("削除しました");
      router.push("/archive");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      <PageHeader
        title="フォームフィードバック"
        breadcrumbs={[
          { label: "アーカイブ", href: "/archive" },
          { label: exercise?.name_ja ?? "フィードバック" },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Tag color="primary">{exercise?.name_ja}</Tag>
            <Tag>
              {format(new Date(session.recorded_at), "M月d日 HH:mm", {
                locale: ja,
              })}
            </Tag>
            {session.weight_kg && <Tag>{session.weight_kg}kg</Tag>}
            {session.reps && <Tag>{session.reps}回</Tag>}
          </div>
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6">
        {/* Left: Video + past sessions (sticky on desktop) */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {session.video_url ? (
            <div className="rounded-lg overflow-hidden bg-black aspect-video border border-border">
              <video
                src={session.video_url}
                className="w-full h-full object-contain"
                controls
                playsInline
                muted
              />
            </div>
          ) : (
            <div className="rounded-lg bg-muted aspect-video flex items-center justify-center">
              <Video className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}

          {pastSessions.length > 0 && (
            <Section title="同種目の履歴" variant="default">
              <div className="flex items-center justify-end mb-2">
                <Link href="/archive">
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    すべて <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pastSessions.map((ps) => (
                  <Link key={ps.id} href={`/form/${ps.id}`}>
                    <div className="shrink-0 w-24 space-y-1">
                      <div className="aspect-video rounded-lg bg-muted overflow-hidden">
                        {ps.frame_url ? (
                          <img
                            src={ps.frame_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(ps.recorded_at), "M/d", {
                          locale: ja,
                        })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right: Feedback */}
        <div className="space-y-5">
          {!feedback ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              フィードバックを読み込み中...
            </div>
          ) : (
            <>
              {/* Hero summary card */}
              <div className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-primary/[0.04] via-card to-card p-5">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative flex items-start gap-4">
                  {checkpointEntries.length > 0 && <ScoreRing score={score} />}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Claude Sonnet 4.6 の総合分析</span>
                    </div>
                    {feedback.overall_comment && (
                      <p className="text-sm leading-relaxed text-foreground">
                        {feedback.overall_comment}
                      </p>
                    )}
                    {checkpointEntries.length > 0 && (
                      <div className="flex items-center gap-3 pt-1 text-xs">
                        <span className="inline-flex items-center gap-1 text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {okCount} OK
                        </span>
                        {improveCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-warning">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {improveCount} 要改善
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Previous comparison */}
              {feedback.previous_comparison && (
                <div className="flex items-start gap-3 p-4 rounded-lg border border-primary/20 bg-primary/[0.04]">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary mb-1">
                      前回との比較
                    </p>
                    <p className="text-sm leading-relaxed">
                      {feedback.previous_comparison}
                    </p>
                  </div>
                </div>
              )}

              {/* Strengths */}
              {feedback.strengths && feedback.strengths.length > 0 && (
                <Section
                  title="できていること"
                  description={`${feedback.strengths.length}項目`}
                  variant="bordered"
                >
                  <div className="grid sm:grid-cols-2 gap-2 pt-3">
                    {feedback.strengths.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 bg-success/8 border border-success/20 rounded-lg px-3 py-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <p className="text-sm leading-relaxed text-foreground">
                          {s}
                        </p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Improvements with severity */}
              {improvements.length > 0 && (
                <Section
                  title="改善ポイント"
                  description={`${improvements.length}項目 / 優先度順`}
                  variant="bordered"
                >
                  <div className="space-y-3 pt-3">
                    {improvements.map((imp, i) => {
                      const cfg = SEVERITY_CONFIG[imp.severity];
                      return (
                        <div
                          key={i}
                          className={`relative overflow-hidden rounded-lg border ${cfg.border} ${cfg.bg} pl-4 pr-3 py-3`}
                        >
                          <div
                            className={`absolute top-0 left-0 bottom-0 w-1 ${cfg.accent}`}
                            aria-hidden
                          />
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-background/60 border border-border text-xs font-semibold text-foreground shrink-0 mt-0.5">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="text-sm font-semibold leading-tight">
                                  {imp.title}
                                </h4>
                                <Tag color={cfg.chip}>{cfg.label}</Tag>
                              </div>
                              {imp.detail && (
                                <p className="text-xs leading-relaxed text-muted-foreground">
                                  {imp.detail}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {/* Checkpoint grid */}
              {checkpointEntries.length > 0 && (
                <Section
                  title="チェックポイント詳細"
                  description={`${checkpointEntries.length}項目`}
                  variant="bordered"
                >
                  <div className="grid sm:grid-cols-2 gap-2 pt-3">
                    {checkpointEntries.map(([name, cp]) => {
                      const config =
                        RESULT_CONFIG[
                          cp.result as keyof typeof RESULT_CONFIG
                        ] ?? RESULT_CONFIG["確認不可"];
                      const Icon = config.icon;
                      return (
                        <div
                          key={name}
                          className={`flex items-start gap-3 border ${config.border} ${config.bg} rounded-lg px-3 py-3`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 mt-0.5 ${config.text}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="text-sm font-medium">
                                {name}
                              </span>
                              <Tag color={config.chip}>{config.label}</Tag>
                            </div>
                            {cp.comment && (
                              <p className="text-xs leading-relaxed text-muted-foreground">
                                {cp.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/form" className="flex-1">
              <Button variant="default" className="w-full gap-2">
                <Video className="w-3.5 h-3.5" />
                新しくチェック
              </Button>
            </Link>
            <Link href="/archive" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                アーカイブを見る
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              削除
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog
        open={confirmingDelete}
        onOpenChange={(open) => !open && setConfirmingDelete(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              このフォームチェックを削除しますか？
            </AlertDialogTitle>
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

      {/* keep AlertCircle import reachable for future use */}
      <AlertCircle className="hidden" aria-hidden />
    </div>
  );
}
