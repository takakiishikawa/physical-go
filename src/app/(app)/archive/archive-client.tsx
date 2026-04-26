"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Columns2, Video, Archive, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Tabs,
  TabsTrigger,
  TabsContent,
  Banner,
  Section,
  EmptyState,
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
import { TabsList } from "@/components/ui/tabs";
import { PageShell } from "@/components/layout/page-shell";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { Exercise, FormSession } from "@/types";
import { EXERCISE_META } from "@/lib/exercise-meta";

interface Props {
  exercises: Exercise[];
  sessions: FormSession[];
  feedbacks: {
    session_id: string;
    overall_comment: string | null;
    created_at: string;
  }[];
}

export function ArchiveClient({ exercises, sessions, feedbacks }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(exercises[0]?.name ?? "");
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const activeExercise = exercises.find((e) => e.name === activeTab);
  const filteredSessions = sessions.filter(
    (s) => s.exercise_id === activeExercise?.id,
  );
  const feedbackMap = Object.fromEntries(
    feedbacks.map((f) => [f.session_id, f]),
  );

  const toggleSelect = (id: string) => {
    if (selected.includes(id))
      setSelected((prev) => prev.filter((s) => s !== id));
    else if (selected.length < 2) setSelected((prev) => [...prev, id]);
  };

  const compareA = sessions.find((s) => s.id === selected[0]);
  const compareB = sessions.find((s) => s.id === selected[1]);

  return (
    <PageShell
      title="フォームアーカイブ"
      icon={<Archive className="w-6 h-6" />}
      description="過去のフォームチェックを振り返ろう"
      actions={
        <Button
          variant={compareMode ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setCompareMode(!compareMode);
            setSelected([]);
          }}
          className="gap-1.5"
        >
          <Columns2 className="w-3.5 h-3.5" />
          {compareMode ? "比較中" : "比較する"}
        </Button>
      }
    >
      {compareMode && (
        <Banner
          variant={selected.length === 2 ? "success" : "info"}
          title={
            selected.length === 0
              ? "比較したい2つのセッションを選んでください"
              : selected.length === 1
                ? "あと1つ選択してください"
                : "選択完了。下に比較が表示されます。"
          }
          dismissible={false}
        />
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setSelected([]);
        }}
      >
        <TabsList variant="underline">
          {exercises.map((ex) => {
            const meta = EXERCISE_META[ex.name] ?? EXERCISE_META.half_deadlift;
            const Icon = meta.icon;
            const count = sessions.filter(
              (s) => s.exercise_id === ex.id,
            ).length;
            return (
              <TabsTrigger
                key={ex.name}
                value={ex.name}
                className="flex items-center gap-2"
              >
                <Icon
                  className="w-3.5 h-3.5"
                  style={{ color: meta.colorVar }}
                />
                {ex.name_ja}
                {count > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {exercises.map((ex) => (
          <TabsContent key={ex.name} value={ex.name} className="mt-6">
            {compareMode && selected.length === 2 && compareA && compareB && (
              <Section title="比較ビュー" variant="bordered" className="mb-6">
                <div className="grid grid-cols-2 gap-4 pt-3">
                  {[compareA, compareB].map((s, idx) => {
                    const fb = feedbackMap[s.id];
                    return (
                      <div key={s.id} className="space-y-2">
                        <div className="aspect-video rounded-lg bg-muted overflow-hidden border border-border">
                          {s.video_url ? (
                            <video
                              src={s.video_url}
                              className="w-full h-full object-contain"
                              controls
                              muted
                              playsInline
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {idx === 0 ? "比較A" : "比較B"}
                          </Badge>
                          <span className="text-xs font-medium">
                            {format(new Date(s.recorded_at), "M月d日", {
                              locale: ja,
                            })}
                          </span>
                          {s.weight_kg && (
                            <span className="text-xs text-muted-foreground">
                              {s.weight_kg}kg
                            </span>
                          )}
                        </div>
                        {fb?.overall_comment && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {fb.overall_comment}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {filteredSessions.length === 0 ? (
              <EmptyState
                icon={<Video className="w-10 h-10" />}
                title="まだフォームチェックがありません"
                action={{
                  label: "フォームチェックする",
                  onClick: () => router.push("/form"),
                }}
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredSessions.map((session) => {
                  const fb = feedbackMap[session.id];
                  const isSelected = selected.includes(session.id);
                  const selIdx = selected.indexOf(session.id);
                  return (
                    <div key={session.id} className="group relative">
                      {compareMode ? (
                        <Button
                          onClick={() => toggleSelect(session.id)}
                          variant="ghost"
                          className={`w-full text-left rounded-lg overflow-hidden border-2 transition-all p-0 h-auto ${
                            isSelected
                              ? "border-primary border border-border ring-2 ring-primary/20"
                              : "border-transparent"
                          }`}
                        >
                          <SessionCard session={session} feedback={fb} />
                          {isSelected && (
                            <div className="absolute top-2 left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-semibold">
                                {selIdx + 1}
                              </span>
                            </div>
                          )}
                        </Button>
                      ) : (
                        <>
                          <Link href={`/form/${session.id}`}>
                            <div className="rounded-lg overflow-hidden border border-border hover:border-primary/40 hover:border border-border transition-all">
                              <SessionCard session={session} feedback={fb} />
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
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
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
    </PageShell>
  );
}

function SessionCard({
  session,
  feedback,
}: {
  session: FormSession;
  feedback?: { overall_comment: string | null } | null;
}) {
  return (
    <div>
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
      <div className="p-2.5 space-y-0.5">
        <p className="text-xs font-medium">
          {format(new Date(session.recorded_at), "M月d日", { locale: ja })}
        </p>
        {(session.weight_kg || session.reps) && (
          <p className="text-xs text-muted-foreground">
            {[
              session.weight_kg && `${session.weight_kg}kg`,
              session.reps && `${session.reps}回`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {feedback?.overall_comment && (
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {feedback.overall_comment}
          </p>
        )}
      </div>
    </div>
  );
}
