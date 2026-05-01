import type { Counts, Task } from "../types";

// All due values are ISO YYYY-MM-DD strings (or undefined).

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export function isDueToday(due: string | undefined, today = todayIso()): boolean {
  return !!due && due === today;
}

export function isOverdue(due: string | undefined, today = todayIso()): boolean {
  return !!due && due < today;
}

export function isUpcoming(due: string | undefined, today = todayIso()): boolean {
  return !!due && due > today;
}

// Display label: "Today" / "Tomorrow" / "Yesterday" / "May 5" / "Jul 12, 2027"
export function formatDue(due: string | undefined): string | null {
  if (!due) return null;
  const today = todayIso();
  if (due === today) return "Today";
  const dueDate = fromIsoDate(due);
  if (!dueDate) return due;
  const todayDate = fromIsoDate(today)!;
  const diffMs = dueDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  const sameYear = dueDate.getFullYear() === todayDate.getFullYear();
  return dueDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export type RepeatInterval = "daily" | "weekly" | "biweekly" | "monthly";
export type RepeatFrom = "due" | "completion";

export interface RepeatSpec {
  interval: RepeatInterval;
  from: RepeatFrom;
}

export function parseRepeat(repeat: string | undefined | null): RepeatSpec | null {
  if (!repeat) return null;
  const [intervalRaw, fromRaw] = repeat.split(":");
  const interval = ["daily", "weekly", "biweekly", "monthly"].includes(intervalRaw)
    ? (intervalRaw as RepeatInterval)
    : null;
  if (!interval) return null;
  const from: RepeatFrom = fromRaw === "completion" ? "completion" : "due";
  return { interval, from };
}

export function serializeRepeat(spec: RepeatSpec | null): string | null {
  if (!spec) return null;
  return spec.from === "completion" ? `${spec.interval}:completion` : spec.interval;
}

export function formatRepeat(repeat: string | undefined | null): string | null {
  const spec = parseRepeat(repeat);
  if (!spec) return null;
  const intervalLabel: Record<RepeatInterval, string> = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
  };
  const base = intervalLabel[spec.interval];
  return spec.from === "completion" ? `${base} · after completion` : base;
}

function lastDayOfMonth(year: number, month: number): number {
  // month is 0-indexed; day 0 of next month = last day of this month
  return new Date(year, month + 1, 0).getDate();
}

export function computeNextDue(task: Task): string | null {
  const spec = parseRepeat(task.repeat);
  if (!spec) return null;
  const baseDate =
    spec.from === "completion"
      ? new Date()
      : task.due
      ? fromIsoDate(task.due) ?? new Date()
      : new Date();
  const next = new Date(baseDate);
  next.setHours(0, 0, 0, 0);
  switch (spec.interval) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly": {
      // Things-style: if base is the last day of its month, snap to last day
      // of the target month. Otherwise keep the day-of-month, capping to the
      // target month's last day if shorter (e.g. Jan 30 → Feb 28).
      const baseDay = next.getDate();
      const baseMonth = next.getMonth();
      const baseYear = next.getFullYear();
      const baseIsLast = baseDay === lastDayOfMonth(baseYear, baseMonth);
      const targetMonthRaw = baseMonth + 1;
      const targetYear = baseYear + Math.floor(targetMonthRaw / 12);
      const targetMonth = targetMonthRaw % 12;
      const targetLast = lastDayOfMonth(targetYear, targetMonth);
      const targetDay = baseIsLast ? targetLast : Math.min(baseDay, targetLast);
      next.setFullYear(targetYear, targetMonth, targetDay);
      break;
    }
  }
  return toIsoDate(next);
}

export function computeCounts(tasks: Task[]): Counts {
  const today = todayIso();
  const counts: Counts = {
    inbox: 0,
    today: 0,
    upcoming: 0,
    anytime: 0,
    someday: 0,
    byProject: {},
  };
  for (const t of tasks) {
    if (t.done) continue;
    if (!t.projectId && t.when === "inbox") counts.inbox++;
    if (t.bucket === "today" || t.bucket === "evening") counts.today++;
    if (isUpcoming(t.due, today)) counts.upcoming++;
    if (t.when === "anytime") counts.anytime++;
    if (t.when === "someday") counts.someday++;
    if (t.projectId) {
      counts.byProject[t.projectId] = (counts.byProject[t.projectId] || 0) + 1;
    }
  }
  return counts;
}
