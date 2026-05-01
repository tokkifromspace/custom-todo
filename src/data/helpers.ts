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
