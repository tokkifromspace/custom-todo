import type { Group, Project, Task } from "../types";

export const initialGroups: Group[] = [
  { id: "work", name: "Work", color: "oklch(0.62 0.13 205)" },
  { id: "personal", name: "Personal", color: "oklch(0.62 0.13 305)" },
];

export const initialProjects: Project[] = [
  { id: "design", groupId: "work", name: "Marq · Design refresh", color: "oklch(0.62 0.13 215)" },
  { id: "okr", groupId: "work", name: "Q2 OKR planning", color: "oklch(0.6 0.11 195)" },
  { id: "brand", groupId: "work", name: "Brand audit", color: "oklch(0.65 0.10 230)" },
  { id: "apartment", groupId: "personal", name: "Apartment", color: "oklch(0.62 0.13 305)" },
  { id: "cooking", groupId: "personal", name: "Cooking", color: "oklch(0.6 0.13 320)" },
  { id: "reading", groupId: "personal", name: "Reading list", color: "oklch(0.6 0.11 290)" },
];

export const initialTasks: Task[] = [
  // Today bucket
  { id: 1, title: "Review hi-fi mocks for filter rail", bucket: "today", when: "today",
    notes: "Compare A/B with marketing on accent intensity",
    projectId: "design", due: "Today", dueToday: true, tags: ["focus"], done: false },
  { id: 2, title: "Send Q2 OKR draft to Mira", bucket: "today", when: "today",
    projectId: "okr", due: "Today", dueToday: true, done: false },
  { id: 3, title: "Sync with engineering on token migration", bucket: "today", when: "today",
    projectId: "design", done: true },
  { id: 4, title: "Lunch with Hana", bucket: "today", when: "today",
    due: "12:30", repeat: "Weekly", done: false },
  { id: 5, title: "Submit expenses for March", bucket: "today", when: "today",
    due: "Apr 30", tags: ["admin"], done: false },
  // Evening bucket
  { id: 6, title: "Reading: Pattern Language ch.7", bucket: "evening", when: "evening",
    projectId: "reading", done: false },
  { id: 7, title: "Water plants on balcony", bucket: "evening", when: "evening",
    repeat: "Every 3 days", done: false },
  { id: 8, title: "Reply to Jun about apartment viewing", bucket: "evening", when: "evening",
    projectId: "apartment", done: false },
  // Marq Design refresh — In Flight
  { id: 9, title: "Define new accent token scale", when: "tomorrow", projectId: "design",
    notes: "Pull samples from Linear, Things, and Bear; cross-check oklch chroma",
    due: "Apr 28", tags: ["tokens"], done: false },
  { id: 10, title: "Audit shadow / depth tokens", when: "tomorrow", projectId: "design",
    due: "Apr 28", done: false },
  { id: 11, title: "Spec liquid-glass surface variants", when: "tomorrow", projectId: "design",
    due: "Apr 29", tags: ["spec"], done: false },
  { id: 12, title: "Pair with Inkyu on icon stroke widths", when: "tomorrow", projectId: "design",
    due: "Apr 30", repeat: "Weekly", done: false },
  // Marq Design — Someday
  { id: 13, title: "Try woodgrain texture as nav backing", when: "someday", projectId: "design",
    tags: ["explore"], done: false },
  { id: 14, title: "Investigate variable font for display", when: "someday", projectId: "design",
    done: false },
  // Marq Design — Logbook
  { id: 15, title: "Kickoff doc + scope", when: "today", projectId: "design", done: true },
  { id: 16, title: "Stakeholder interviews (4)", when: "today", projectId: "design", done: true },
  { id: 17, title: "Competitive teardown deck", when: "today", projectId: "design", done: true },
  // Inbox
  { id: 18, title: "Shortcut for quickly creating recurring tasks", when: "inbox", done: false },
  { id: 19, title: "Find cafe for next 1:1 with Mira", when: "inbox", done: false },
  { id: 20, title: "Draft trip itinerary for Jeju", when: "inbox", done: false },
  // Anytime
  { id: 21, title: "Read draft from team retrospective", when: "anytime", projectId: "okr", done: false },
  { id: 22, title: "Try the new ramen place", when: "anytime", projectId: "cooking", done: false },
  // Someday
  { id: 23, title: "Plan a weekend in Busan", when: "someday", projectId: "apartment", done: false },
  { id: 24, title: "Learn how to make handmade pasta", when: "someday", projectId: "cooking", done: false },
  // Other projects
  { id: 25, title: "Compile brand voice samples", when: "tomorrow", projectId: "brand",
    due: "Apr 29", done: false },
  { id: 26, title: "Sign lease addendum", when: "tomorrow", projectId: "apartment",
    due: "May 2", done: false },
];
