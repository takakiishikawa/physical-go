import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArchiveClient } from "./archive-client";

export default async function ArchivePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: exercises }, { data: sessions }, { data: feedbacks }] =
    await Promise.all([
      supabase.schema("physicalgo").from("exercises").select("*"),
      supabase
        .schema("physicalgo")
        .from("form_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false }),
      supabase
        .schema("physicalgo")
        .from("form_feedbacks")
        .select(
          "session_id, overall_comment, strengths, improvements, created_at",
        )
        .eq("user_id", user.id),
    ]);

  return (
    <ArchiveClient
      exercises={exercises ?? []}
      sessions={sessions ?? []}
      feedbacks={feedbacks ?? []}
    />
  );
}
