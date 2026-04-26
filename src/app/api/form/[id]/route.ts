import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: session, error: fetchError } = await supabase
    .schema("physicalgo")
    .from("form_sessions")
    .select("id, user_id, video_url, frame_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Best-effort: remove storage objects owned by this user.
  // Path inside the bucket is everything after `/storage/v1/object/public/<bucket>/`.
  const objectKeys = [session.video_url, session.frame_url]
    .filter((u): u is string => typeof u === "string" && u.length > 0)
    .map((url) => extractObjectKey(url, "physicalgo"))
    .filter(
      (key): key is string => key !== null && key.startsWith(`${user.id}/`),
    );

  if (objectKeys.length > 0) {
    await supabase.storage.from("physicalgo").remove(objectKeys);
  }

  // Delete feedback rows first to avoid FK orphans, then the session.
  await supabase
    .schema("physicalgo")
    .from("form_feedbacks")
    .delete()
    .eq("session_id", id)
    .eq("user_id", user.id);

  const { error: deleteError } = await supabase
    .schema("physicalgo")
    .from("form_sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

function extractObjectKey(url: string, bucket: string): string | null {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}
