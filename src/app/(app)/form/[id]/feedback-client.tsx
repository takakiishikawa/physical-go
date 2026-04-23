"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Video,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import {
  Banner,
  Section,
  Tag,
  TagGroup,
  PageHeader,
} from "@takaki/go-design-system";
import type { FormSession, FormFeedback, Exercise } from "@/types";

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
  OK: { icon: CheckCircle2, color: "success" as const, label: "OK" },
  要改善: { icon: AlertCircle, color: "warning" as const, label: "要改善" },
  確認不可: { icon: HelpCircle, color: "default" as const, label: "確認不可" },
};

export function FeedbackClient({ session, feedback, pastSessions }: Props) {
  const exercise = session.exercises;
  const checkpoints = feedback?.checkpoints as Record<
    string,
    { result: string; comment: string }
  > | null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Video */}
        <div className="space-y-4">
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
            <Section title="過去のセッション" variant="default">
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
                      <p className="text-[10px] text-muted-foreground">
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
        <div className="space-y-4">
          {!feedback ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              フィードバックを読み込み中...
            </div>
          ) : (
            <>
              <Banner
                variant="info"
                title="総合コメント"
                description={feedback.overall_comment ?? undefined}
              />

              {feedback.previous_comparison && (
                <Banner
                  variant="success"
                  title="前回との比較"
                  description={feedback.previous_comparison}
                />
              )}

              {feedback.strengths && feedback.strengths.length > 0 && (
                <Section title="できていること" variant="bordered">
                  <div className="space-y-2 pt-3">
                    {feedback.strengths.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 bg-success/10 border border-success/20 rounded-lg px-3 py-2.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">{s}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {feedback.improvements && feedback.improvements.length > 0 && (
                <Section title="改善点" variant="bordered">
                  <div className="space-y-2 pt-3">
                    {feedback.improvements.map((imp, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 bg-warning/10 border border-warning/20 rounded-lg px-3 py-2.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground">{imp}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {checkpoints && Object.keys(checkpoints).length > 0 && (
                <Section title="チェックポイント詳細" variant="bordered">
                  <div className="space-y-2 pt-3">
                    {Object.entries(checkpoints).map(([name, cp]) => {
                      const config =
                        RESULT_CONFIG[
                          cp.result as keyof typeof RESULT_CONFIG
                        ] ?? RESULT_CONFIG["確認不可"];
                      const Icon = config.icon;
                      return (
                        <div
                          key={name}
                          className="flex items-start gap-3 border rounded-lg px-3 py-3"
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              config.color === "success"
                                ? "text-success"
                                : config.color === "warning"
                                  ? "text-warning"
                                  : "text-muted-foreground"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">
                                {name}
                              </span>
                              <Tag color={config.color}>{config.label}</Tag>
                            </div>
                            {cp.comment && (
                              <p className="text-xs text-muted-foreground mt-0.5">
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

          <div className="flex gap-3 pt-1">
            <Link href="/form" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <Video className="w-3.5 h-3.5" />
                新しくチェック
              </Button>
            </Link>
            <Link href="/archive" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <ChevronLeft className="w-3.5 h-3.5" />
                アーカイブへ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
