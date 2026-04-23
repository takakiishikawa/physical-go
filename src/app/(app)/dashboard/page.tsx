import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [
    { data: exercises },
    { data: personalRecords },
    { data: recentFeedback },
    { data: bodyRecord },
  ] = await Promise.all([
    supabase.schema("physicalgo").from("exercises").select("*"),
    supabase
      .schema("physicalgo")
      .from("personal_records")
      .select("*, exercises(*)")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: true }),
    supabase
      .schema("physicalgo")
      .from("form_feedbacks")
      .select("*, form_sessions(*, exercises(*)), exercises(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .schema("physicalgo")
      .from("body_records")
      .select("*")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <DashboardClient
      exercises={exercises ?? []}
      personalRecords={personalRecords ?? []}
      recentFeedback={recentFeedback}
      latestBodyRecord={bodyRecord}
      userName={user.user_metadata?.full_name ?? user.email ?? "User"}
    />
  );
}
