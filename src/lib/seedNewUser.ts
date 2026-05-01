import { supabase } from "./supabase";
import { seedGroups, seedProjects, seedTasks } from "../data/seed";

// Inserts default groups/projects/tasks for the current authenticated user.
// Called when a fresh account loads zero groups.
export async function seedNewUser(): Promise<void> {
  const groupRows = seedGroups.map((g, i) => ({
    name: g.name,
    color: g.color,
    sort_order: i,
  }));
  const groupRes = await supabase
    .from("groups")
    .insert(groupRows)
    .select("id, name");
  if (groupRes.error) throw groupRes.error;

  const groupKeyToId = new Map<string, string>();
  for (const row of groupRes.data ?? []) {
    const seed = seedGroups.find((g) => g.name === row.name);
    if (seed) groupKeyToId.set(seed.key, row.id);
  }

  const projectRows = seedProjects.map((p, i) => ({
    group_id: groupKeyToId.get(p.groupKey) ?? null,
    name: p.name,
    color: p.color,
    sort_order: i,
  }));
  const projectRes = await supabase
    .from("projects")
    .insert(projectRows)
    .select("id, name");
  if (projectRes.error) throw projectRes.error;

  const projectKeyToId = new Map<string, string>();
  for (const row of projectRes.data ?? []) {
    const seed = seedProjects.find((p) => p.name === row.name);
    if (seed) projectKeyToId.set(seed.key, row.id);
  }

  const taskRows = seedTasks.map((t, i) => ({
    project_id: t.projectKey ? projectKeyToId.get(t.projectKey) ?? null : null,
    title: t.title,
    notes: t.notes ?? null,
    bucket: t.bucket ?? null,
    when_at: t.when,
    due: t.due ?? null,
    due_today: t.dueToday ?? false,
    due_overdue: t.dueOverdue ?? false,
    repeat: t.repeat ?? null,
    tags: t.tags ?? [],
    done: t.done,
    sort_order: i,
  }));

  const taskRes = await supabase.from("tasks").insert(taskRows);
  if (taskRes.error) throw taskRes.error;
}
