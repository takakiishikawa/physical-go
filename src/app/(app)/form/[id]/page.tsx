import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { FeedbackClient } from "./feedback-client";

export default async function FormFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: session } = await supabase
    .schema("physicalgo")
    .from("form_sessions")
    .select("*, exercises(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!session) notFound();

  const { data: feedback } = await supabase
    .schema("physicalgo")
    .from("form_feedbacks")
    .select("*")
    .eq("session_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Past sessions for same exercise
  const { data: pastSessions } = await supabase
    .schema("physicalgo")
    .from("form_sessions")
    .select("id, recorded_at, weight_kg, reps, frame_url")
    .eq("user_id", user.id)
    .eq("exercise_id", session.exercise_id)
    .neq("id", id)
    .order("recorded_at", { ascending: false })
    .limit(5);

  return (
    <FeedbackClient
      session={session}
      feedback={feedback}
      pastSessions={pastSessions ?? []}
    />
  );
}
