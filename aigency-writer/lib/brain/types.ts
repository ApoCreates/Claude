export type LessonSource = "coaching" | "feedback" | "training" | "research";

export interface Lesson {
  id: string;
  /** ISO date the lesson was learned */
  date: string;
  source: LessonSource;
  /** Which language the correction applies to */
  lang: "ar" | "en" | "both";
  /** The distilled, imperative rule the agent must follow from now on */
  text: string;
}

export interface Insight {
  id: string;
  date: string;
  topic: string;
  text: string;
}

export interface FeedbackRecord {
  id: string;
  date: string;
  mode: string;
  rating: "up" | "down";
  comment?: string;
  excerpt?: string;
}
