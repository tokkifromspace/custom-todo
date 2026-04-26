import type { Counts, Task } from "../types";

const TODAY_DAY = 26;

export function dayFromDue(due: string | undefined): number | null {
  if (!due) return null;
  if (due === "Today") return TODAY_DAY;
  if (due === "Tomorrow") return TODAY_DAY + 1;
  const m = /^Apr\s+(\d{1,2})$/.exec(due);
  if (m) return parseInt(m[1], 10);
  return null;
}

export function computeCounts(tasks: Task[]): Counts {
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
    const day = dayFromDue(t.due);
    if (day != null && day > TODAY_DAY) counts.upcoming++;
    if (t.when === "anytime") counts.anytime++;
    if (t.when === "someday") counts.someday++;
    if (t.projectId) {
      counts.byProject[t.projectId] = (counts.byProject[t.projectId] || 0) + 1;
    }
  }
  return counts;
}
