export type Bucket = "today" | "evening";

export type When =
  | "today"
  | "evening"
  | "tomorrow"
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
  // ISO YYYY-MM-DD
  due?: string;
  repeat?: string;
  projectId?: string;
  tags?: string[];
  done: boolean;
}

export type View =
  | { type: "today" }
  | { type: "upcoming" }
  | { type: "inbox" }
  | { type: "anytime" }
  | { type: "someday" }
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
  | "repeat" | "attachment" | "drop" | "trash";

export interface NewTaskPayload {
  title: string;
  notes?: string;
  when: When;
  bucket?: Bucket | null;
  // ISO YYYY-MM-DD
  due?: string;
  // serialized repeat: "daily" | "weekly" | "biweekly" | "monthly" | "<interval>:completion"
  repeat?: string;
  projectId?: string;
  tags?: string[];
}
