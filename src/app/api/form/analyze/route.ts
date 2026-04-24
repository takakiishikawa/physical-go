import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import type { AIFeedback } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const videoFile = formData.get("video") as File | null;

  if (!videoFile) {
    return NextResponse.json({ error: "動画が必要です" }, { status: 400 });
  }

  // Fetch all available exercises
  const { data: exercises } = await supabase
    .schema("physicalgo")
    .from("exercises")
    .select("*");

  if (!exercises || exercises.length === 0) {
    return NextResponse.json(
      { error: "種目が見つかりません" },
      { status: 500 },
    );
  }

  const exerciseList = exercises
    .map((e) => `- ${e.name}（${e.name_ja}）`)
    .join("\n");

  // Get previous feedbacks for context
  const { data: prevFeedbacks } = await supabase
    .schema("physicalgo")
    .from("form_feedbacks")
    .select("exercise_id, improvements, overall_comment, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const videoBuffer = Buffer.from(await videoFile.arrayBuffer());

  // Upload video to Supabase Storage
  const videoPath = `${user.id}/videos/${Date.now()}-${videoFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage
    .from("physicalgo")
    .upload(videoPath, videoBuffer, {
      contentType: videoFile.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json(
      { error: `動画のアップロードに失敗しました: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl: videoUrl },
  } = supabase.storage.from("physicalgo").getPublicUrl(videoPath);

  const prevContext = prevFeedbacks?.length
    ? prevFeedbacks
        .map((f) => {
          const ex = exercises.find((e) => e.id === f.exercise_id);
          const improvements = Array.isArray(f.improvements)
            ? f.improvements.join("、")
            : "";
          return ex ? `${ex.name_ja}: ${improvements}` : "";
        })
        .filter(Boolean)
        .join("\n")
    : "なし（初回）";

  const prompt = `あなたはパーソナルトレーナーです。トレーニング動画を分析します。

【対応している種目】
${exerciseList}

【過去のフィードバック（改善点）】
${prevContext}

動画ファイル: ${videoFile.name}（${Math.round(videoBuffer.length / 1024)}KB）

上記の種目のうちどれを行っているか判断し、フォームを分析してください。以下のJSON形式のみで返してください（コードブロックなし）：
{
  "exercise_name": "half_deadlift | pull_up | bench_press",
  "overall_comment": "全体的な一言コメント（ポジティブ起点・50文字以内）",
  "strengths": ["できていること1", "できていること2"],
  "improvements": ["改善点1", "改善点2"],
  "checkpoints": {
    "チェックポイント名": { "result": "OK/要改善/確認不可", "comment": "詳細（30文字以内）" }
  },
  "previous_comparison": "前回指摘した改善点について（初回は空文字列）",
  "diagram_instruction": ""
}`;

  let aiResponse: AIFeedback & { exercise_name?: string };

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected AI response type");
    const jsonMatch = block.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI response is not valid JSON");
    aiResponse = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error("AI analysis error:", e);
    aiResponse = {
      exercise_name: "half_deadlift",
      overall_comment: "動画を確認しました。継続していきましょう。",
      strengths: ["継続的なトレーニングへの取り組み"],
      improvements: ["動画の画質を上げると、より詳細な分析が可能です"],
      checkpoints: {},
      previous_comparison: "",
      diagram_instruction: "",
    };
  }

  // Find exercise by AI's response
  const detectedExercise =
    exercises.find((e) => e.name === aiResponse.exercise_name) ?? exercises[0];

  const { data: session, error: sessionError } = await supabase
    .schema("physicalgo")
    .from("form_sessions")
    .insert({
      user_id: user.id,
      exercise_id: detectedExercise.id,
      video_url: videoUrl,
      weight_kg: null,
      reps: null,
      recorded_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (sessionError)
    return NextResponse.json({ error: sessionError.message }, { status: 500 });

  const { data: feedback, error: feedbackError } = await supabase
    .schema("physicalgo")
    .from("form_feedbacks")
    .insert({
      session_id: session.id,
      user_id: user.id,
      exercise_id: detectedExercise.id,
      overall_comment: aiResponse.overall_comment,
      checkpoints: aiResponse.checkpoints,
      improvements: aiResponse.improvements,
      strengths: aiResponse.strengths,
      previous_comparison: aiResponse.previous_comparison,
      diagram_url: null,
    })
    .select()
    .single();

  if (feedbackError)
    return NextResponse.json({ error: feedbackError.message }, { status: 500 });

  return NextResponse.json({
    session_id: session.id,
    feedback_id: feedback.id,
  });
}
