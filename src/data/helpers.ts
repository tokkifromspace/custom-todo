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
  // For weekly/biweekly: 0=Sun .. 6=Sat. For monthly: 1..31.
  // null means "no specific day" (legacy / fallback to base+interval)
  dayParam: number | null;
  from: RepeatFrom;
}

const DOW_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function parseRepeat(repeat: string | undefined | null): RepeatSpec | null {
  if (!repeat) return null;
  const parts = repeat.split(":");
  const intervalRaw = parts[0];
  if (!["daily", "weekly", "biweekly", "monthly"].includes(intervalRaw)) return null;
  const interval = intervalRaw as RepeatInterval;
  let dayParam: number | null = null;
  let from: RepeatFrom = "due";
  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    if (p === "completion") {
      from = "completion";
      continue;
    }
    if (interval === "weekly" || interval === "biweekly") {
      const dow = DOW_KEYS.indexOf(p as (typeof DOW_KEYS)[number]);
      if (dow >= 0) dayParam = dow;
    } else if (interval === "monthly") {
      const dom = parseInt(p, 10);
      if (dom >= 1 && dom <= 31) dayParam = dom;
    }
  }
  return { interval, dayParam, from };
}

export function serializeRepeat(spec: RepeatSpec | null): string | null {
  if (!spec) return null;
  let s: string = spec.interval;
  if (spec.dayParam !== null) {
    if (spec.interval === "weekly" || spec.interval === "biweekly") {
      s += `:${DOW_KEYS[spec.dayParam]}`;
    } else if (spec.interval === "monthly") {
      s += `:${spec.dayParam}`;
    }
  }
  if (spec.from === "completion") s += ":completion";
  return s;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
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
  let base = intervalLabel[spec.interval];
  if (spec.dayParam !== null) {
    if (spec.interval === "weekly" || spec.interval === "biweekly") {
      base += ` · ${DOW_LABELS[spec.dayParam]}`;
    } else if (spec.interval === "monthly") {
      base += ` · ${ordinal(spec.dayParam)}`;
    }
  }
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
    case "biweekly": {
      if (spec.dayParam !== null) {
        // Lock to specified weekday: advance to next occurrence after `next`,
        // then for biweekly skip one extra week.
        next.setDate(next.getDate() + 1);
        const diff = (spec.dayParam - next.getDay() + 7) % 7;
        next.setDate(next.getDate() + diff);
        if (spec.interval === "biweekly") {
          next.setDate(next.getDate() + 7);
        }
      } else {
        next.setDate(next.getDate() + (spec.interval === "weekly" ? 7 : 14));
      }
      break;
    }
    case "monthly": {
      if (spec.dayParam !== null) {
        // Lock to specified day-of-month. If base's day < target, target is in
        // the same month; otherwise next month. Cap to that month's last day
        // (e.g. monthly:31 in February → Feb 28).
        const baseDay = next.getDate();
        let targetMonth = next.getMonth();
        let targetYear = next.getFullYear();
        if (baseDay >= spec.dayParam) {
          targetMonth += 1;
          if (targetMonth > 11) {
            targetMonth = 0;
            targetYear += 1;
          }
        }
        const targetLast = lastDayOfMonth(targetYear, targetMonth);
        const targetDay = Math.min(spec.dayParam, targetLast);
        next.setFullYear(targetYear, targetMonth, targetDay);
      } else {
        // Legacy: advance by one month with Things-style last-day-of-month
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
      }
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
