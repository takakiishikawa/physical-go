import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecordClient } from "./record-client";

export default async function RecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const [{ data: exercises }, { data: personalRecords }] = await Promise.all([
    supabase.schema("physicalgo").from("exercises").select("*"),
    supabase
      .schema("physicalgo")
      .from("personal_records")
      .select("*, exercises(*)")
      .eq("user_id", user.id)
      .order("recorded_at", { ascending: false }),
  ]);

  return (
    <RecordClient
      exercises={exercises ?? []}
      personalRecords={personalRecords ?? []}
      userId={user.id}
    />
  );
}
