import type { MediaKind, Platform, PublishResult } from "./connectors/types";
export type { MediaKind, Platform, PublishResult };

export type PostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed" | "blocked";

export interface PostTarget {
  platform: Platform;
  status: PostStatus;
  result?: PublishResult;
  attemptedAt?: string;
}

export interface Post {
  id: string;
  title: string;
  text: string;
  kind: MediaKind;
  mediaUrls: string[];
  targets: PostTarget[];
  /** ISO. Null means it sits as a draft until someone schedules it. */
  scheduledFor: string | null;
  createdAt: string;
  updatedAt: string;
  /** Slug of the .aigency run that produced it, when there is one. */
  runSlug?: string;
  /** Review gate — a post that has not passed cannot be published. */
  review: { verdict: "PASS" | "FAIL" | "NOT_RUN"; failures: string[]; checkedAt?: string };
}

export interface StudioState {
  posts: Post[];
}
