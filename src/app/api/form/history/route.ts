import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const exerciseId = searchParams.get("exercise_id");

  let query = supabase
    .schema("physicalgo")
    .from("form_sessions")
    .select("*, exercises(*), form_feedbacks(*)")
    .eq("user_id", user.id)
    .order("recorded_at", { ascending: false });

  if (exerciseId) {
    query = query.eq("exercise_id", exerciseId);
  }

  const { data, error } = await query;

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
