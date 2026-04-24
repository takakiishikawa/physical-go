import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FormClient } from "./form-client";

export default async function FormPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: sessions }, { data: feedbacks }] = await Promise.all([
    supabase
      .schema("physicalgo")
      .from("form_sessions")
      .select("*, exercises(*)")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false }),
    supabase
      .schema("physicalgo")
      .from("form_feedbacks")
      .select("session_id, overall_comment, created_at")
      .eq("user_id", user.id),
  ]);

  return <FormClient sessions={sessions ?? []} feedbacks={feedbacks ?? []} />;
}
