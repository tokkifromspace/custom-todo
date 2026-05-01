import { useEffect, useRef, useState } from "react";
import type { IconName, NewTaskPayload, Project, Task, When } from "../types";
import { formatDue, fromIsoDate, parseRepeat, serializeRepeat, toIsoDate, todayIso } from "../data/helpers";
import type { RepeatInterval } from "../data/helpers";
import { Icon } from "./Icon";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: NewTaskPayload) => void;
  projects: Project[];
  defaultProjectId?: string | null;
  editingTask?: Task | null;
}

interface BucketDef {
  v: When;
  l: string;
  c: string;
  icon: IconName;
}

export function NewTaskModal({ open, onClose, onSubmit, projects, defaultProjectId, editingTask }: Props) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState<When>("today");
  const [showDeadline, setShowDeadline] = useState(false);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [showRepeat, setShowRepeat] = useState(false);
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>("weekly");
  const [repeatDow, setRepeatDow] = useState<number>(1); // Mon
  const [repeatDom, setRepeatDom] = useState<number>(1);
  const [repeatFromCompletion, setRepeatFromCompletion] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(defaultProjectId ?? null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [tagOpen, setTagOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setNotes(editingTask.notes ?? "");
      setWhen(editingTask.when);
      setDeadline(editingTask.due ?? null);
      setShowDeadline(!!editingTask.due);
      const spec = parseRepeat(editingTask.repeat);
      setShowRepeat(!!spec);
      setRepeatInterval(spec?.interval ?? "weekly");
      setRepeatFromCompletion(spec?.from === "completion");
      const baseDate = editingTask.due ? fromIsoDate(editingTask.due) : null;
      if (spec?.interval === "weekly" || spec?.interval === "biweekly") {
        setRepeatDow(spec.dayParam ?? baseDate?.getDay() ?? new Date().getDay());
      } else {
        setRepeatDow(baseDate?.getDay() ?? new Date().getDay());
      }
      if (spec?.interval === "monthly") {
        setRepeatDom(spec.dayParam ?? baseDate?.getDate() ?? new Date().getDate());
      } else {
        setRepeatDom(baseDate?.getDate() ?? new Date().getDate());
      }
      setProjectId(editingTask.projectId ?? null);
      setTags(editingTask.tags ?? []);
    } else {
      setTitle("");
      setNotes("");
      setWhen("today");
      setShowDeadline(false);
      setDeadline(null);
      setShowRepeat(false);
      setRepeatInterval("weekly");
      setRepeatFromCompletion(false);
      setRepeatDow(new Date().getDay());
      setRepeatDom(new Date().getDate());
      setProjectId(defaultProjectId ?? null);
      setTags([]);
    }
    setTagDraft("");
    setTagOpen(false);
    setProjectMenuOpen(false);
    setTimeout(() => titleRef.current?.focus(), 30);
  }, [open, defaultProjectId, editingTask]);

  const submit = () => {
    let due: string | undefined;
    if (deadline) {
      due = deadline;
    } else if (when === "today" || when === "evening") {
      due = todayIso();
    } else if (when === "tomorrow") {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      due = toIsoDate(t);
    }
    let repeatDayParam: number | null = null;
    if (repeatInterval === "weekly" || repeatInterval === "biweekly") {
      repeatDayParam = repeatDow;
    } else if (repeatInterval === "monthly") {
      repeatDayParam = repeatDom;
    }
    const repeat = showRepeat
      ? serializeRepeat({
          interval: repeatInterval,
          dayParam: repeatDayParam,
          from: repeatFromCompletion ? "completion" : "due",
        }) ?? undefined
      : undefined;
    onSubmit({
      title: title.trim(),
      notes: notes.trim() || undefined,
      when,
      bucket: when === "today" ? "today" : when === "evening" ? "evening" : null,
      due,
      repeat,
      projectId: projectId ?? undefined,
      tags: tags.length ? tags : undefined,
    });
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!projectMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setProjectMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [projectMenuOpen]);

  if (!open) return null;

  const suggestions = ["tokens", "focus", "design", "research", "blocked"];
  const remainingSuggestions = suggestions.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(tagDraft.toLowerCase()),
  );
  const addTag = (t: string) => {
    const v = (t || "").trim();
    if (!v || tags.includes(v)) return;
    setTags([...tags, v]);
    setTagDraft("");
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const project = projectId ? projects.find((p) => p.id === projectId) : null;

  const buckets: BucketDef[] = [
    { v: "today", l: "Today", c: "var(--warm)", icon: "sun" },
    { v: "evening", l: "Evening", c: "var(--evening)", icon: "moon" },
    { v: "tomorrow", l: "Tomorrow", c: "var(--accent)", icon: "calendar" },
    { v: "anytime", l: "Anytime", c: "var(--fg-3)", icon: "list" },
    { v: "someday", l: "Someday", c: "var(--someday)", icon: "drop" },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 200,
        background: "oklch(0 0 0 / 0.22)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong"
        style={{ width: 540, borderRadius: 18, overflow: "visible", boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ padding: "20px 22px 12px" }}>
          <input
            ref={titleRef}
            placeholder="What needs doing?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              all: "unset",
              width: "100%",
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--fg)",
            }}
          />
          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{
              all: "unset",
              display: "block",
              width: "100%",
              marginTop: 6,
              fontSize: 13,
              color: "var(--fg-2)",
              lineHeight: 1.45,
              resize: "none",
            }}
          />
        </div>

        <div style={{ padding: "8px 18px 14px" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--fg-4)",
              marginBottom: 8,
            }}
          >
            When
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, marginBottom: 12 }}>
            {buckets.map((b) => {
              const on = when === b.v;
              return (
                <div
                  key={b.v}
                  onClick={() => setWhen(b.v)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    padding: "10px 4px",
                    borderRadius: 10,
                    cursor: "default",
                    background: on ? "oklch(0.78 0.12 60 / 0.16)" : "oklch(0.4 0.01 80 / 0.04)",
                  }}
                >
                  <span style={{ color: b.c }}>
                    <Icon name={b.icon} size={15} />
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: on ? 600 : 500, color: on ? "var(--fg)" : "var(--fg-2)" }}>
                    {b.l}
                  </span>
                </div>
              );
            })}
          </div>

          {!showDeadline ? (
            <button
              type="button"
              onClick={() => setShowDeadline(true)}
              style={{
                all: "unset",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--fg-3)",
                cursor: "default",
                background: "var(--bg-hover)",
              }}
            >
              <Icon name="calendar" size={12} />
              <span>Add deadline</span>
            </button>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="date"
                value={deadline ?? ""}
                min={todayIso()}
                onChange={(e) => setDeadline(e.target.value || null)}
                className="auth-input"
                style={{ height: 32, fontSize: 12.5, padding: "0 10px", maxWidth: 180 }}
              />
              {deadline && (
                <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{formatDue(deadline)}</span>
              )}
              <span style={{ flex: 1 }} />
              <button
                type="button"
                className="icon-btn"
                style={{ width: 26, height: 26 }}
                onClick={() => {
                  setShowDeadline(false);
                  setDeadline(null);
                }}
                title="Remove deadline"
              >
                <Icon name="x" size={12} />
              </button>
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            {!showRepeat ? (
              <button
                type="button"
                onClick={() => setShowRepeat(true)}
                style={{
                  all: "unset",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--fg-3)",
                  cursor: "default",
                  background: "var(--bg-hover)",
                }}
              >
                <Icon name="repeat" size={12} />
                <span>Add repeat</span>
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Icon name="repeat" size={12} style={{ color: "var(--fg-3)" }} />
                  <select
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(e.target.value as RepeatInterval)}
                    className="auth-input"
                    style={{ height: 32, fontSize: 12.5, padding: "0 8px" }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  {(repeatInterval === "weekly" || repeatInterval === "biweekly") && (
                    <div style={{ display: "flex", gap: 2 }}>
                      {["S", "M", "T", "W", "T", "F", "S"].map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRepeatDow(i)}
                          className={`dow-btn ${repeatDow === i ? "active" : ""}`}
                          aria-pressed={repeatDow === i}
                          aria-label={["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][i]}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                  {repeatInterval === "monthly" && (
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={repeatDom}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (Number.isFinite(v)) setRepeatDom(Math.max(1, Math.min(31, v)));
                      }}
                      className="auth-input"
                      style={{ height: 32, fontSize: 12.5, padding: "0 8px", width: 56 }}
                      aria-label="Day of month"
                    />
                  )}
                  <span style={{ flex: 1 }} />
                  <button
                    type="button"
                    className="icon-btn"
                    style={{ width: 26, height: 26 }}
                    onClick={() => {
                      setShowRepeat(false);
                      setRepeatFromCompletion(false);
                      setRepeatInterval("weekly");
                    }}
                    title="Remove repeat"
                  >
                    <Icon name="x" size={12} />
                  </button>
                </div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fg-2)", cursor: "default", paddingLeft: 22 }}>
                  <input
                    type="checkbox"
                    checked={repeatFromCompletion}
                    onChange={(e) => setRepeatFromCompletion(e.target.checked)}
                  />
                  From completion
                </label>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div ref={projectMenuRef} style={{ position: "relative" }}>
            <div
              onClick={() => setProjectMenuOpen((o) => !o)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 10px",
                borderRadius: 8,
                background: "var(--bg-hover)",
                cursor: "default",
                minHeight: 30,
                boxSizing: "border-box",
              }}
            >
              {project ? (
                <span style={{ width: 10, height: 10, borderRadius: 3, background: project.color, flexShrink: 0 }} />
              ) : (
                <Icon name="folder" size={13} style={{ color: "var(--fg-3)" }} />
              )}
              <span
                style={{
                  fontSize: 12.5,
                  color: project ? "var(--fg)" : "var(--fg-3)",
                  fontWeight: 500,
                }}
              >
                {project ? project.name : "No project"}
              </span>
            </div>
            {projectMenuOpen && (
              <div
                className="glass-strong"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  width: 240,
                  padding: 4,
                  borderRadius: 8,
                  zIndex: 5,
                  boxShadow: "var(--shadow-md)",
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                <div
                  onClick={() => {
                    setProjectId(null);
                    setProjectMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 5,
                    fontSize: 12,
                    color: "var(--fg-2)",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon name="inbox" size={11} style={{ color: "var(--fg-4)" }} />
                  No project (Inbox)
                </div>
                {projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setProjectId(p.id);
                      setProjectMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      borderRadius: 5,
                      fontSize: 12,
                      color: "var(--fg-2)",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 8,
              background: "var(--bg-hover)",
              minHeight: 30,
              boxSizing: "border-box",
            }}
          >
            <Icon
              name="tag"
              size={13}
              style={{ color: tags.length ? "var(--accent)" : "var(--fg-3)", flexShrink: 0 }}
            />
            {tags.map((t) => (
              <span
                key={t}
                className="chip"
                style={{ background: "oklch(1 0 0 / 0.6)", color: "var(--fg-2)", fontWeight: 500, fontSize: 11.5, paddingRight: 4 }}
              >
                {t}
                <span
                  onClick={() => removeTag(t)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    color: "var(--fg-4)",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0 0 0 / 0.08)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <Icon name="x" size={9} />
                </span>
              </span>
            ))}
            {tagOpen ? (
              <input
                autoFocus
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagDraft);
                  } else if (e.key === "Escape") {
                    setTagOpen(false);
                    setTagDraft("");
                  } else if (e.key === "Backspace" && !tagDraft && tags.length) {
                    removeTag(tags[tags.length - 1]);
                  }
                }}
                onBlur={() => {
                  if (tagDraft) addTag(tagDraft);
                  setTimeout(() => setTagOpen(false), 120);
                }}
                placeholder="Add tag…"
                style={{ all: "unset", flex: 1, minWidth: 60, fontSize: 12.5, color: "var(--fg)" }}
              />
            ) : (
              <span
                onClick={() => setTagOpen(true)}
                style={{ fontSize: 12.5, color: "var(--fg-3)", cursor: "default", flex: 1 }}
              >
                {tags.length ? "" : "Add tag"}
              </span>
            )}
            {tagOpen && remainingSuggestions.length > 0 && (
              <div
                className="glass-strong"
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  right: 0,
                  padding: 4,
                  borderRadius: 8,
                  zIndex: 5,
                  boxShadow: "var(--shadow-md)",
                }}
              >
                {remainingSuggestions.slice(0, 4).map((s) => (
                  <div
                    key={s}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTag(s);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 8px",
                      borderRadius: 5,
                      fontSize: 12,
                      color: "var(--fg-2)",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Icon name="tag" size={10} style={{ color: "var(--fg-4)" }} />
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="icon-btn"><Icon name="attachment" size={14} /></span>
          <span className="icon-btn"><Icon name="flag" size={14} /></span>
          <span style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit}>
            {editingTask ? "Save" : "Add task"}
            <span className="kbd" style={{ background: "oklch(1 0 0 / 0.2)", color: "white" }}>⌘↵</span>
          </button>
        </div>
      </div>
    </div>
  );
}
