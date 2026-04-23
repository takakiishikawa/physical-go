import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BodyClient } from "./body-client";

export default async function BodyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: bodyRecords } = await supabase
    .schema("physicalgo")
    .from("body_records")
    .select("*")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: true });

  return <BodyClient bodyRecords={bodyRecords ?? []} userId={user.id} />;
}
