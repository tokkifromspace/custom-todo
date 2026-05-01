import { useEffect, useMemo, useState } from "react";
import type { Group, NewTaskPayload, Project, Task, View } from "./types";
import { Sidebar } from "./components/Sidebar";
import { NewTaskModal } from "./components/NewTaskModal";
import { ChangePasswordModal } from "./components/ChangePasswordModal";
import { QuickFindModal } from "./components/QuickFindModal";
import { UndoToast } from "./components/UndoToast";
import { TodayView } from "./views/TodayView";
import { ProjectView } from "./views/ProjectView";
import { UpcomingView } from "./views/UpcomingView";
import { ListView } from "./views/ListView";
import { computeCounts } from "./data/helpers";
import { useData } from "./lib/data";
import { useAuth } from "./lib/auth";

function App() {
  const {
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
    updateProject,
    reorderProjects,
    deleteTask,
    undoDeleteTask,
    deleteProject,
  } = useData();
  const { signOut, updatePassword } = useAuth();
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [view, setView] = useState<View>({ type: "today" });
  const [quickAdd, setQuickAdd] = useState(false);
  const [quickAddDefaultDate, setQuickAddDefaultDate] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [quickFindOpen, setQuickFindOpen] = useState(false);

  useEffect(() => {
    if (view.type === "project" && !projects.some((p) => p.id === view.id)) {
      setView({ type: "today" });
    }
  }, [view, projects]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (e.code !== "KeyN" && e.code !== "KeyK") return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      e.preventDefault();
      if (e.code === "KeyN") setQuickAdd(true);
      else setQuickFindOpen(true);
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

  const handleSubmitTask = (payload: NewTaskPayload) => {
    if (editingTask) {
      void updateTask(editingTask.id, payload);
    } else {
      void addTask(payload);
      if (payload.bucket === "today" || payload.bucket === "evening") {
        setView({ type: "today" });
      }
    }
  };

  const closeTaskModal = () => {
    setQuickAdd(false);
    setQuickAddDefaultDate(null);
    setEditingTask(null);
  };

  const openQuickAdd = (defaultDate?: string) => {
    setQuickAddDefaultDate(defaultDate ?? null);
    setQuickAdd(true);
  };

  const handleSetDue = (id: string, due: string | null) => {
    void updateTask(id, { due: due ?? undefined });
  };

  const handleAddProject = async (groupId: string, name: string) => {
    const created = await addProject(groupId, name);
    if (created) setView({ type: "project", id: created.id });
  };

  const defaultProjectId = view.type === "project" ? view.id : null;

  if (loading) {
    return <div className="app mesh-cool" data-theme="light" data-density="comfortable" />;
  }

  let pane: React.ReactNode = null;
  if (view.type === "today") {
    pane = (
      <TodayView
        tasks={tasks}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onEdit={setEditingTask}
        onSetDue={handleSetDue}
        onReorder={reorderTasks}
        recentlyCompleted={recentlyCompleted}
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
          onDelete={deleteTask}
          onEdit={setEditingTask}
          onSetDue={handleSetDue}
          onReorder={reorderTasks}
          onRenameProject={(id, name) => void updateProject(id, { name })}
          recentlyCompleted={recentlyCompleted}
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
        onDelete={deleteTask}
        onEdit={setEditingTask}
        onSetDue={handleSetDue}
        recentlyCompleted={recentlyCompleted}
        projectsById={projectsById}
        onQuickAdd={openQuickAdd}
      />
    );
  } else if (view.type === "inbox") {
    const list = tasks.filter((t) => t.when === "inbox" && (!t.done || recentlyCompleted.has(t.id)));
    pane = (
      <ListView
        title="Inbox"
        glyph="inbox"
        glyphColor="var(--accent)"
        subtitle="Unsorted · drop in any thought"
        tasks={list}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onEdit={setEditingTask}
        onSetDue={handleSetDue}
        onReorder={reorderTasks}
        projectsById={projectsById}
        onQuickAdd={() => setQuickAdd(true)}
      />
    );
  } else if (view.type === "anytime") {
    const list = tasks.filter((t) => t.when === "anytime" && (!t.done || recentlyCompleted.has(t.id)));
    pane = (
      <ListView
        title="Anytime"
        glyph="list"
        glyphColor="var(--fg-3)"
        subtitle="No specific time — pick when ready"
        tasks={list}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onEdit={setEditingTask}
        onSetDue={handleSetDue}
        onReorder={reorderTasks}
        projectsById={projectsById}
        onQuickAdd={() => setQuickAdd(true)}
      />
    );
  } else if (view.type === "someday") {
    const list = tasks.filter((t) => t.when === "someday" && (!t.done || recentlyCompleted.has(t.id)));
    pane = (
      <ListView
        title="Someday"
        glyph="drop"
        glyphColor="var(--someday)"
        subtitle="Maybe later — out of mind, not lost"
        tasks={list}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onEdit={setEditingTask}
        onSetDue={handleSetDue}
        onReorder={reorderTasks}
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
        onAddProject={handleAddProject}
        onDeleteProject={deleteProject}
        onReorderProjects={reorderProjects}
        onQuickFind={() => setQuickFindOpen(true)}
        onChangePassword={() => setPwModalOpen(true)}
        onSignOut={() => void signOut()}
      />
      {pane}
      {error && (
        <div className="app-error" role="alert">
          {error}
        </div>
      )}
      <NewTaskModal
        open={quickAdd || !!editingTask}
        onClose={closeTaskModal}
        onSubmit={handleSubmitTask}
        projects={projects}
        defaultProjectId={defaultProjectId}
        defaultDate={quickAddDefaultDate}
        editingTask={editingTask}
      />
      <UndoToast pending={pendingDelete} onUndo={undoDeleteTask} />
      <ChangePasswordModal
        open={pwModalOpen}
        onClose={() => setPwModalOpen(false)}
        onSubmit={updatePassword}
      />
      <QuickFindModal
        open={quickFindOpen}
        onClose={() => setQuickFindOpen(false)}
        tasks={tasks}
        projects={projects}
        projectsById={projectsById}
        onSelectTask={(t) => setEditingTask(t)}
        onSelectProject={(p) => setView({ type: "project", id: p.id })}
      />
    </div>
  );
}

export default App;
