import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FormClient } from "./form-client";

export default async function FormPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: exercises } = await supabase
    .schema("physicalgo")
    .from("exercises")
    .select("*");

  return <FormClient exercises={exercises ?? []} userId={user.id} />;
}
