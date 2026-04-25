export interface UserSettings {
  id: string;
  user_id: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  created_at: string;
  updated_at: string;
}

export interface BodyRecord {
  id: string;
  user_id: string;
  recorded_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  photo_url: string | null;
  note: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  name_ja: string;
  description: string | null;
  filming_guide: string | null;
  key_checkpoints: string[];
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  recorded_at: string;
  weight_kg: number | null;
  reps: number | null;
  record_type: "weight_5rep" | "max_reps" | "volume";
  note: string | null;
  is_pr: boolean;
  created_at: string;
  exercises?: Exercise;
}

export interface FormSession {
  id: string;
  user_id: string;
  exercise_id: string;
  recorded_at: string;
  video_url: string | null;
  frame_url: string | null;
  weight_kg: number | null;
  reps: number | null;
  created_at: string;
  exercises?: Exercise;
}

export type ImprovementSeverity = "high" | "medium" | "low";

export interface ImprovementItem {
  title: string;
  detail: string;
  severity: ImprovementSeverity;
}

export type ImprovementInput = string | ImprovementItem;

export interface FormFeedback {
  id: string;
  session_id: string;
  user_id: string;
  exercise_id: string;
  overall_comment: string | null;
  checkpoints: Record<string, { result: string; comment: string }> | null;
  improvements: ImprovementInput[] | null;
  strengths: string[] | null;
  diagram_url: string | null;
  previous_comparison: string | null;
  created_at: string;
  form_sessions?: FormSession;
  exercises?: Exercise;
}

export interface AIFeedback {
  overall_comment: string;
  strengths: string[];
  improvements: ImprovementInput[];
  checkpoints: Record<string, { result: string; comment: string }>;
  previous_comparison: string;
}
