import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 120;

interface AnalyzeRequest {
  videoPath: string;
  videoUrl: string;
  fileName: string;
  fileSize: number;
  frames: string[]; // data URLs: data:image/jpeg;base64,...
}

const FEEDBACK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    exercise_name: {
      type: "string",
      enum: ["half_deadlift", "pull_up", "bench_press"],
    },
    overall_comment: {
      type: "string",
      description:
        "全体評価。具体的な観察に基づく前向きで建設的なコメント（80〜140字）",
    },
    overall_rating: {
      type: "string",
      enum: ["excellent", "good", "fair", "needs_work"],
      description:
        "全体評価。excellent=ほぼ完璧, good=概ね良好, fair=改善余地あり, needs_work=要修正多数",
    },
    score: {
      type: "integer",
      minimum: 0,
      maximum: 100,
      description: "総合スコア 0–100",
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      minItems: 2,
      maxItems: 4,
      description:
        "できていることを身体部位や局面とセットで具体的に（各40〜70字）",
    },
    improvements: {
      type: "array",
      minItems: 2,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
            description: "改善ポイントの簡潔な見出し（〜20字）",
          },
          detail: {
            type: "string",
            description:
              "観察→原因→具体的修正方法の順で書く詳細アドバイス（80〜160字）",
          },
          severity: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
        },
        required: ["title", "detail", "severity"],
      },
    },
    checkpoints: {
      type: "array",
      minItems: 4,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
            description: "チェックポイント名（例: 膝の動き、バーの軌道）",
          },
          result: {
            type: "string",
            enum: ["OK", "要改善", "確認不可"],
          },
          comment: {
            type: "string",
            description: "観察結果と短い指摘（30〜60字）",
          },
        },
        required: ["name", "result", "comment"],
      },
    },
    previous_comparison: {
      type: "string",
      description:
        "過去のフィードバックと比較し、前回指摘点が改善されているかを述べる。初回時は空文字。",
    },
  },
  required: [
    "exercise_name",
    "overall_comment",
    "overall_rating",
    "score",
    "strengths",
    "improvements",
    "checkpoints",
    "previous_comparison",
  ],
} as const;

interface AIResponse {
  exercise_name: "half_deadlift" | "pull_up" | "bench_press";
  overall_comment: string;
  overall_rating: "excellent" | "good" | "fair" | "needs_work";
  score: number;
  strengths: string[];
  improvements: { title: string; detail: string; severity: "high" | "medium" | "low" }[];
  checkpoints: { name: string; result: "OK" | "要改善" | "確認不可"; comment: string }[];
  previous_comparison: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: AnalyzeRequest;
  try {
    body = (await request.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json(
      { error: "リクエスト形式が不正です" },
      { status: 400 },
    );
  }

  const { videoPath, videoUrl, fileName, frames } = body;
  if (!videoPath || !videoUrl || !fileName) {
    return NextResponse.json(
      { error: "動画情報が不足しています" },
      { status: 400 },
    );
  }
  if (!Array.isArray(frames) || frames.length === 0) {
    return NextResponse.json(
      { error: "フレームが取得できませんでした。動画を再選択してください。" },
      { status: 400 },
    );
  }
  if (!videoPath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const { data: prevFeedbacks } = await supabase
    .schema("physicalgo")
    .from("form_feedbacks")
    .select("exercise_id, improvements, overall_comment, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const prevContext = prevFeedbacks?.length
    ? prevFeedbacks
        .map((f) => {
          const ex = exercises.find((e) => e.id === f.exercise_id);
          if (!ex) return "";
          const improvements = Array.isArray(f.improvements)
            ? (f.improvements as unknown[])
                .map((imp) =>
                  typeof imp === "string"
                    ? imp
                    : typeof imp === "object" && imp && "title" in imp
                      ? String((imp as { title: unknown }).title)
                      : "",
                )
                .filter(Boolean)
                .join("、")
            : "";
          return `${ex.name_ja}: ${improvements}`;
        })
        .filter(Boolean)
        .join("\n")
    : "なし（初回）";

  const systemPrompt = `あなたはNSCA-CSCS資格を持つ熟練のストレングスコーチで、ウエイトトレーニングのフォームを動画から細かく分析するプロです。
評価対象の種目は次のいずれかです：
${exerciseList}

評価方針:
- 提供されたフレームは時系列順（開始→終了）です。フレーム全体を通して関節角度・バーの軌道・テンポ・対称性・動作レンジを総合的に観察してください。
- 推測ではなく、実際にフレームから読み取れる事実に基づきフィードバックしてください。
- ポジティブな点と改善点を必ず両方伝え、上から目線にならないトレーナー口調で。
- 改善点は「観察した事実 → なぜそれが問題か → 次回どう直すか」を具体的に書く。
- チェックポイントは種目ごとに重要な4〜7項目を選び、確認できなかった項目は "確認不可" にする。
- スコアは100点満点。65=平均的、80=安定、90+=競技レベル。
- 過去フィードバックがある場合は previous_comparison でその進捗に触れる。
- 出力は必ず指定されたJSONスキーマに従う。`;

  const userText = `この動画は「${fileName}」というファイルから抽出されたフォームチェック動画です。
時系列順に並んだ ${frames.length} 枚のフレームを送ります。
種目を判定し、フォームを丁寧に分析してください。

【過去のフィードバック（直近）】
${prevContext}`;

  const imageBlocks: Anthropic.ImageBlockParam[] = frames
    .map((dataUrl, idx): Anthropic.ImageBlockParam | null => {
      const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
      if (!match) return null;
      const mediaType = match[1] as "image/jpeg" | "image/png" | "image/webp";
      const data = match[2];
      return {
        type: "image",
        source: { type: "base64", media_type: mediaType, data },
        ...(idx === 0 ? {} : {}),
      };
    })
    .filter((b): b is Anthropic.ImageBlockParam => b !== null)
    .slice(0, 8);

  if (imageBlocks.length === 0) {
    return NextResponse.json(
      { error: "フレームの形式が不正です" },
      { status: 400 },
    );
  }

  const userContent: Anthropic.ContentBlockParam[] = [
    { type: "text", text: userText },
    ...imageBlocks.map((img, idx): Anthropic.ContentBlockParam[] => [
      { type: "text", text: `フレーム ${idx + 1}/${imageBlocks.length}` },
      img,
    ]).flat(),
  ];

  let aiResponse: AIResponse;

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: FEEDBACK_SCHEMA },
      },
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("AI response missing text block");
    }
    aiResponse = JSON.parse(textBlock.text) as AIResponse;
  } catch (e) {
    console.error("AI analysis error:", e);
    return NextResponse.json(
      {
        error:
          "AI解析に失敗しました。動画が短すぎるか画質が低い可能性があります。再撮影をお試しください。",
      },
      { status: 500 },
    );
  }

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

  const checkpointsObj: Record<string, { result: string; comment: string }> = {};
  for (const cp of aiResponse.checkpoints) {
    checkpointsObj[cp.name] = { result: cp.result, comment: cp.comment };
  }

  const { data: feedback, error: feedbackError } = await supabase
    .schema("physicalgo")
    .from("form_feedbacks")
    .insert({
      session_id: session.id,
      user_id: user.id,
      exercise_id: detectedExercise.id,
      overall_comment: aiResponse.overall_comment,
      checkpoints: checkpointsObj,
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
    score: aiResponse.score,
    rating: aiResponse.overall_rating,
  });
}
