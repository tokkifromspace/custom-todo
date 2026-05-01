import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { seedNewUser } from "./seedNewUser";
import { computeNextDue, parseRepeat } from "../data/helpers";
import type {
  Bucket,
  Group,
  NewTaskPayload,
  Project,
  Task,
  When,
} from "../types";

const OFFLINE_MESSAGE = "You're offline — changes will resume when you're back online.";

interface TaskRow {
  id: string;
  title: string;
  notes: string | null;
  bucket: string | null;
  when_at: string;
  due: string | null;
  repeat: string | null;
  project_id: string | null;
  tags: string[];
  done: boolean;
}

interface ProjectRow {
  id: string;
  group_id: string | null;
  name: string;
  color: string;
}

interface GroupRow {
  id: string;
  name: string;
  color: string;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? undefined,
    bucket: (row.bucket as Bucket | null) ?? undefined,
    when: row.when_at as When,
    due: row.due ?? undefined,
    repeat: row.repeat ?? undefined,
    projectId: row.project_id ?? undefined,
    tags: row.tags.length > 0 ? row.tags : undefined,
    done: row.done,
  };
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    groupId: row.group_id ?? "",
    name: row.name,
    color: row.color,
  };
}

function toGroup(row: GroupRow): Group {
  return { id: row.id, name: row.name, color: row.color };
}

interface DataContextValue {
  groups: Group[];
  projects: Project[];
  tasks: Task[];
  loading: boolean;
  error: string | null;
  pendingDelete: Task | null;
  recentlyCompleted: Set<string>;
  toggleTask: (id: string) => Promise<void>;
  addTask: (payload: NewTaskPayload) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  reorderTasks: (orderedIds: string[]) => Promise<void>;
  addProject: (groupId: string, name: string) => Promise<Project | null>;
  deleteTask: (task: Task) => void;
  undoDeleteTask: () => void;
  deleteProject: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [groups, setGroups] = useState<Group[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(() => new Set());
  const recentTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const RECENT_COMPLETE_MS = 5000;
  const markRecentlyCompleted = useCallback((id: string) => {
    setRecentlyCompleted((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    const existing = recentTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setRecentlyCompleted((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      recentTimers.current.delete(id);
    }, RECENT_COMPLETE_MS);
    recentTimers.current.set(id, timer);
  }, []);

  const clearRecentlyCompleted = useCallback((id: string) => {
    const t = recentTimers.current.get(id);
    if (t) {
      clearTimeout(t);
      recentTimers.current.delete(id);
    }
    setRecentlyCompleted((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const tasksRef = useRef<Task[]>([]);
  const projectsRef = useRef<Project[]>([]);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const pendingDeleteRef = useRef<{
    task: Task;
    index: number;
    timer: ReturnType<typeof setTimeout>;
  } | null>(null);

  const finalizePendingDelete = useCallback(async () => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingDeleteRef.current = null;
    setPendingDelete(null);
    const { error } = await supabase.from("tasks").delete().eq("id", pending.task.id);
    if (error) setError(error.message);
  }, []);

  const loadingRef = useRef(false);
  const loadAll = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const [g, p, t] = await Promise.all([
        supabase.from("groups").select("id, name, color").order("sort_order").order("created_at"),
        supabase.from("projects").select("id, group_id, name, color").order("sort_order").order("created_at"),
        supabase
          .from("tasks")
          .select("id, title, notes, bucket, when_at, due, repeat, project_id, tags, done")
          .order("sort_order")
          .order("created_at"),
      ]);
      if (g.error) throw g.error;
      if (p.error) throw p.error;
      if (t.error) throw t.error;

      let groupsRows = (g.data ?? []) as GroupRow[];
      let projectsRows = (p.data ?? []) as ProjectRow[];
      let tasksRows = (t.data ?? []) as TaskRow[];

      if (groupsRows.length === 0) {
        await seedNewUser();
        const [g2, p2, t2] = await Promise.all([
          supabase.from("groups").select("id, name, color").order("sort_order").order("created_at"),
          supabase.from("projects").select("id, group_id, name, color").order("sort_order").order("created_at"),
          supabase
            .from("tasks")
            .select("id, title, notes, bucket, when_at, due, repeat, project_id, tags, done")
            .order("sort_order")
            .order("created_at"),
        ]);
        if (g2.error) throw g2.error;
        if (p2.error) throw p2.error;
        if (t2.error) throw t2.error;
        groupsRows = (g2.data ?? []) as GroupRow[];
        projectsRows = (p2.data ?? []) as ProjectRow[];
        tasksRows = (t2.data ?? []) as TaskRow[];
      }

      setGroups(groupsRows.map(toGroup));
      setProjects(projectsRows.map(toProject));
      setTasks(tasksRows.map(toTask));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setGroups([]);
      setProjects([]);
      setTasks([]);
      setLoading(false);
      return;
    }
    loadAll();
  }, [userId, loadAll]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const toggleTask = useCallback(async (id: string) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError(OFFLINE_MESSAGE);
      return;
    }
    const current = tasksRef.current.find((t) => t.id === id);
    if (!current) return;

    // Repeat: instead of marking done, advance the due date and clear the
    // today/evening bucket (the next instance is in the future, no longer "today")
    if (!current.done && parseRepeat(current.repeat)) {
      const nextDue = computeNextDue(current);
      const prevDue = current.due;
      const prevBucket = current.bucket;
      setTasks((ts) =>
        ts.map((t) =>
          t.id === id ? { ...t, due: nextDue ?? undefined, bucket: undefined } : t,
        ),
      );
      const { error } = await supabase
        .from("tasks")
        .update({ due: nextDue ?? null, bucket: null })
        .eq("id", id);
      if (error) {
        setTasks((ts) =>
          ts.map((t) =>
            t.id === id ? { ...t, due: prevDue, bucket: prevBucket } : t,
          ),
        );
        setError(error.message);
      }
      return;
    }

    const prevDone = current.done;
    const willBeDone = !prevDone;
    setTasks((ts) =>
      ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
    if (willBeDone) markRecentlyCompleted(id);
    else clearRecentlyCompleted(id);

    const { error } = await supabase
      .from("tasks")
      .update({ done: !prevDone })
      .eq("id", id);
    if (error) {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: prevDone } : t)));
      // Revert recent-completed bookkeeping too
      if (willBeDone) clearRecentlyCompleted(id);
      setError(error.message);
    }
  }, [markRecentlyCompleted, clearRecentlyCompleted]);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError(OFFLINE_MESSAGE);
      return;
    }
    if (id.startsWith("temp-")) {
      setError("This task is still being created — try again in a moment.");
      return;
    }
    const prev = tasksRef.current.find((t) => t.id === id);
    if (!prev) return;

    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));

    const dbPatch: Record<string, unknown> = {};
    if ("title" in patch) dbPatch.title = patch.title;
    if ("notes" in patch) dbPatch.notes = patch.notes ?? null;
    if ("bucket" in patch) dbPatch.bucket = patch.bucket ?? null;
    if ("when" in patch) dbPatch.when_at = patch.when;
    if ("due" in patch) dbPatch.due = patch.due ?? null;
    if ("repeat" in patch) dbPatch.repeat = patch.repeat ?? null;
    if ("projectId" in patch) dbPatch.project_id = patch.projectId ?? null;
    if ("tags" in patch) dbPatch.tags = patch.tags ?? [];
    if ("done" in patch) dbPatch.done = patch.done;

    const { error } = await supabase.from("tasks").update(dbPatch).eq("id", id);
    if (error) {
      setTasks((ts) => ts.map((t) => (t.id === id ? prev : t)));
      setError(error.message);
    }
  }, []);

  const reorderTasks = useCallback(async (orderedIds: string[]) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError(OFFLINE_MESSAGE);
      return;
    }
    if (orderedIds.length === 0) return;
    if (orderedIds.some((id) => id.startsWith("temp-"))) return;

    const movingSet = new Set(orderedIds);
    const baseOffset = 1000;

    setTasks((ts) => {
      const idToTask = new Map(ts.map((t) => [t.id, t]));
      const queue = orderedIds
        .map((id) => idToTask.get(id))
        .filter((t): t is Task => !!t);
      // Walk original list; at every position occupied by a moving task,
      // pull the next task from the new order. Non-moving tasks keep their slot.
      return ts.map((t) => (movingSet.has(t.id) ? queue.shift() ?? t : t));
    });

    const ops = orderedIds.map((id, i) =>
      supabase.from("tasks").update({ sort_order: baseOffset + i }).eq("id", id),
    );
    const results = await Promise.all(ops);
    const firstErr = results.find((r) => r.error);
    if (firstErr?.error) setError(firstErr.error.message);
  }, []);

  const addTask = useCallback(async (payload: NewTaskPayload) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError(OFFLINE_MESSAGE);
      return;
    }
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: Task = { id: tempId, done: false, ...payload };
    setTasks((ts) => [optimistic, ...ts]);
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: payload.title,
        notes: payload.notes ?? null,
        bucket: payload.bucket ?? null,
        when_at: payload.when,
        due: payload.due ?? null,
        repeat: payload.repeat ?? null,
        project_id: payload.projectId ?? null,
        tags: payload.tags ?? [],
      })
      .select("id, title, notes, bucket, when_at, due, repeat, project_id, tags, done")
      .single();
    if (error || !data) {
      setTasks((ts) => ts.filter((t) => t.id !== tempId));
      setError(error?.message ?? "Failed to add task");
      return;
    }
    const real = toTask(data as TaskRow);
    setTasks((ts) => ts.map((t) => (t.id === tempId ? real : t)));
  }, []);

  const addProject = useCallback(
    async (groupId: string, name: string): Promise<Project | null> => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError(OFFLINE_MESSAGE);
        return null;
      }
      const group = groups.find((g) => g.id === groupId);
      const color = group?.color ?? "var(--accent)";
      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic: Project = { id: tempId, groupId, name, color };
      setProjects((ps) => [...ps, optimistic]);
      const { data, error } = await supabase
        .from("projects")
        .insert({ group_id: groupId, name, color })
        .select("id, group_id, name, color")
        .single();
      if (error || !data) {
        setProjects((ps) => ps.filter((p) => p.id !== tempId));
        setError(error?.message ?? "Failed to add project");
        return null;
      }
      const real = toProject(data as ProjectRow);
      setProjects((ps) => ps.map((p) => (p.id === tempId ? real : p)));
      return real;
    },
    [groups],
  );

  const deleteTask = useCallback(
    (task: Task) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setError(OFFLINE_MESSAGE);
        return;
      }
      // commit any prior pending delete immediately before queuing a new one
      if (pendingDeleteRef.current) {
        const prior = pendingDeleteRef.current;
        clearTimeout(prior.timer);
        pendingDeleteRef.current = null;
        void supabase
          .from("tasks")
          .delete()
          .eq("id", prior.task.id)
          .then(({ error }) => {
            if (error) setError(error.message);
          });
      }
      const idx = tasksRef.current.findIndex((t) => t.id === task.id);
      if (idx === -1) return;
      setTasks((ts) => ts.filter((t) => t.id !== task.id));
      const timer = setTimeout(() => {
        void finalizePendingDelete();
      }, 5000);
      pendingDeleteRef.current = { task, index: idx, timer };
      setPendingDelete(task);
    },
    [finalizePendingDelete],
  );

  const undoDeleteTask = useCallback(() => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pendingDeleteRef.current = null;
    setPendingDelete(null);
    setTasks((ts) => {
      const insertAt = Math.min(pending.index, ts.length);
      return [...ts.slice(0, insertAt), pending.task, ...ts.slice(insertAt)];
    });
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError(OFFLINE_MESSAGE);
      return;
    }
    const removed = projectsRef.current.find((p) => p.id === id);
    if (!removed) return;
    const affectedTaskIds = tasksRef.current
      .filter((t) => t.projectId === id)
      .map((t) => t.id);

    setProjects((ps) => ps.filter((p) => p.id !== id));
    setTasks((ts) =>
      ts.map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t)),
    );

    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) {
      // revert
      setProjects((ps) => [...ps, removed]);
      const affectedSet = new Set(affectedTaskIds);
      setTasks((ts) =>
        ts.map((t) => (affectedSet.has(t.id) ? { ...t, projectId: id } : t)),
      );
      setError(error.message);
    }
  }, []);

  const value: DataContextValue = {
    groups,
    projects,
    tasks,
    loading,
    error,
    pendingDelete,
    recentlyCompleted,
    toggleTask,
    addTask,
    updateTask,
    reorderTasks,
    addProject,
    deleteTask,
    undoDeleteTask,
    deleteProject,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
