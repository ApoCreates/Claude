export type CrewMember = {
  name: string;
  role: string;
};

export type SubmissionStatus = "submitted" | "selected" | "awarded";

export type Submission = {
  id: string;
  slug: string;
  title: string;
  logline: string;
  youtube_url: string;
  duration_seconds: number;
  poster_url: string | null;
  team_name: string;
  submitter_name: string;
  submitter_email: string;
  crew: CrewMember[];
  ai_tools: string;
  ai_disclosure: string;
  cohort: string;
  category: string | null;
  status: SubmissionStatus;
  award: string | null;
  featured: boolean;
  votes: number;
  created_at: string;
};

export type NewSubmission = Omit<
  Submission,
  "id" | "slug" | "status" | "award" | "featured" | "votes" | "created_at"
>;

export type Rating = {
  id: string;
  submission_id: string;
  juror: string;
  story: number;
  craft: number;
  ai: number;
  emotion: number;
  notes: string | null;
  created_at: string;
};

export type NewRating = Omit<Rating, "id" | "created_at">;

export type RatingSummary = {
  count: number;
  story: number;
  craft: number;
  ai: number;
  emotion: number;
  overall: number;
};
