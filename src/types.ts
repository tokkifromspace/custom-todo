export type Bucket = "today" | "evening";

export type When =
  | "today"
  | "evening"
  | "tomorrow"
  | "scheduled"
  | "anytime"
  | "someday"
  | "inbox";

export interface Group {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  groupId: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  bucket?: Bucket | null;
  when: When;
  // ISO YYYY-MM-DD - when the user wants to do the task
  due?: string;
  // ISO YYYY-MM-DD - hard deadline by which the task is due
  deadline?: string;
  repeat?: string;
  projectId?: string;
  tags?: string[];
  done: boolean;
  // ISO timestamp; Logbook uses this as a proxy for completedAt
  updatedAt?: string;
}

export type View =
  | { type: "today" }
  | { type: "upcoming" }
  | { type: "inbox" }
  | { type: "anytime" }
  | { type: "someday" }
  | { type: "logbook" }
  | { type: "project"; id: string };

export interface Counts {
  inbox: number;
  today: number;
  upcoming: number;
  anytime: number;
  someday: number;
  byProject: Record<string, number>;
}

export type IconName =
  | "star" | "sun" | "moon" | "calendar" | "clock"
  | "inbox" | "search" | "plus" | "tag" | "flag"
  | "more" | "chev" | "chev-d" | "check" | "x"
  | "folder" | "list" | "filter" | "settings"
  | "repeat" | "attachment" | "drop" | "trash"
  | "archive" | "comment" | "subtask";

export interface NewTaskPayload {
  title: string;
  notes?: string;
  when: When;
  bucket?: Bucket | null;
  // ISO YYYY-MM-DD - scheduled date
  due?: string;
  // ISO YYYY-MM-DD - hard deadline
  deadline?: string;
  // serialized repeat: "daily" | "weekly" | "biweekly" | "monthly" | "<interval>:completion"
  repeat?: string;
  projectId?: string;
  tags?: string[];
}
