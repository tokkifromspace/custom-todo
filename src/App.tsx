import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, NewTaskPayload, Project, Task, View } from "./types";
import { Sidebar } from "./components/Sidebar";
import { NewTaskModal } from "./components/NewTaskModal";
import { TodayView } from "./views/TodayView";
import { ProjectView } from "./views/ProjectView";
import { UpcomingView } from "./views/UpcomingView";
import { ListView } from "./views/ListView";
import { initialGroups, initialProjects, initialTasks } from "./data/seed";
import { computeCounts } from "./data/helpers";

function App() {
  const [view, setView] = useState<View>({ type: "today" });
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [groups] = useState<Group[]>(initialGroups);
  const [quickAdd, setQuickAdd] = useState(false);
  const nextId = useRef(100);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setQuickAdd(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const projectsById = useMemo(() => {
    const m: Record<string, Project> = {};
    for (const p of projects) m[p.id] = p;
    return m;
  }, [projects]);

  const groupsById = useMemo(() => {
    const m: Record<string, Group> = {};
    for (const g of groups) m[g.id] = g;
    return m;
  }, [groups]);

  const counts = useMemo(() => computeCounts(tasks), [tasks]);

  const toggleTask = (id: number) => {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const addTask = (payload: NewTaskPayload) => {
    const id = nextId.current++;
    setTasks((ts) => [{ id, done: false, ...payload }, ...ts]);
    if (payload.bucket === "today" || payload.bucket === "evening") {
      setView({ type: "today" });
    }
  };

  const addProject = (groupId: string, name: string) => {
    const g = groupsById[groupId];
    const id = `proj-${nextId.current++}`;
    const color = g?.color ?? "var(--accent)";
    const newProject: Project = { id, groupId, name, color };
    setProjects((ps) => [...ps, newProject]);
    setView({ type: "project", id });
  };

  const defaultProjectId = view.type === "project" ? view.id : null;

  let pane: React.ReactNode = null;
  if (view.type === "today") {
    pane = (
      <TodayView
        tasks={tasks}
        onToggle={toggleTask}
        projectsById={projectsById}
        onQuickAdd={() => setQuickAdd(true)}
      />
    );
  } else if (view.type === "project") {
    const project = projectsById[view.id];
    if (project) {
      const group = groupsById[project.groupId];
      pane = (
        <ProjectView
          project={project}
          group={group}
          tasks={tasks}
          onToggle={toggleTask}
          projectsById={projectsById}
          onQuickAdd={() => setQuickAdd(true)}
        />
      );
    }
  } else if (view.type === "upcoming") {
    pane = (
      <UpcomingView
        tasks={tasks}
        onToggle={toggleTask}
        projectsById={projectsById}
        onQuickAdd={() => setQuickAdd(true)}
      />
    );
  } else if (view.type === "inbox") {
    const list = tasks.filter((t) => t.when === "inbox" && !t.done);
    pane = (
      <ListView
        title="Inbox"
        glyph="inbox"
        glyphColor="var(--accent)"
        subtitle="Unsorted · drop in any thought"
        tasks={list}
        onToggle={toggleTask}
        projectsById={projectsById}
        onQuickAdd={() => setQuickAdd(true)}
      />
    );
  } else if (view.type === "anytime") {
    const list = tasks.filter((t) => t.when === "anytime" && !t.done);
    pane = (
      <ListView
        title="Anytime"
        glyph="list"
        glyphColor="var(--fg-3)"
        subtitle="No specific time — pick when ready"
        tasks={list}
        onToggle={toggleTask}
        projectsById={projectsById}
        onQuickAdd={() => setQuickAdd(true)}
      />
    );
  } else if (view.type === "someday") {
    const list = tasks.filter((t) => t.when === "someday" && !t.done);
    pane = (
      <ListView
        title="Someday"
        glyph="drop"
        glyphColor="var(--someday)"
        subtitle="Maybe later — out of mind, not lost"
        tasks={list}
        onToggle={toggleTask}
        projectsById={projectsById}
        onQuickAdd={() => setQuickAdd(true)}
      />
    );
  }

  const meshClass = view.type === "today" || view.type === "inbox" ? "mesh-warm" : "mesh-cool";

  return (
    <div
      className={`app ${meshClass}`}
      data-theme="light"
      data-density="comfortable"
      style={{ position: "relative" }}
    >
      <Sidebar
        view={view}
        onNavigate={setView}
        groups={groups}
        projects={projects}
        counts={counts}
        onAddProject={addProject}
      />
      {pane}
      <NewTaskModal
        open={quickAdd}
        onClose={() => setQuickAdd(false)}
        onSubmit={addTask}
        projects={projects}
        defaultProjectId={defaultProjectId}
      />
    </div>
  );
}

export default App;
