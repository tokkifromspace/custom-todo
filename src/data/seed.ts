import type { Bucket, When } from "../types";

// Seed data for new users — DB generates all uuids on insert.
// `key` / `groupKey` / `projectKey` are logical handles used to wire up
// FK relations during the seed insert flow (see lib/seedNewUser.ts).
//
// `dayOffset` (when present) is days from today: 0 = today, 1 = tomorrow,
// 2 = day after tomorrow, etc. seedNewUser converts it to an ISO date.

export interface SeedGroup {
  key: string;
  name: string;
  color: string;
}

export interface SeedProject {
  key: string;
  groupKey: string;
  name: string;
  color: string;
}

export interface SeedTask {
  projectKey?: string;
  title: string;
  notes?: string;
  bucket?: Bucket | null;
  when: When;
  dayOffset?: number;
  repeat?: string;
  tags?: string[];
  done: boolean;
}

export const seedGroups: SeedGroup[] = [
  { key: "work", name: "Work", color: "oklch(0.62 0.13 205)" },
  { key: "personal", name: "Personal", color: "oklch(0.62 0.13 305)" },
];

export const seedProjects: SeedProject[] = [
  { key: "design", groupKey: "work", name: "Marq · Design refresh", color: "oklch(0.62 0.13 215)" },
  { key: "okr", groupKey: "work", name: "Q2 OKR planning", color: "oklch(0.6 0.11 195)" },
  { key: "brand", groupKey: "work", name: "Brand audit", color: "oklch(0.65 0.10 230)" },
  { key: "apartment", groupKey: "personal", name: "Apartment", color: "oklch(0.62 0.13 305)" },
  { key: "cooking", groupKey: "personal", name: "Cooking", color: "oklch(0.6 0.13 320)" },
  { key: "reading", groupKey: "personal", name: "Reading list", color: "oklch(0.6 0.11 290)" },
];

export const seedTasks: SeedTask[] = [
  // Today bucket
  { title: "Review hi-fi mocks for filter rail", bucket: "today", when: "today",
    notes: "Compare A/B with marketing on accent intensity",
    projectKey: "design", dayOffset: 0, tags: ["focus"], done: false },
  { title: "Send Q2 OKR draft to Mira", bucket: "today", when: "today",
    projectKey: "okr", dayOffset: 0, done: false },
  { title: "Sync with engineering on token migration", bucket: "today", when: "today",
    projectKey: "design", done: true },
  { title: "Lunch with Hana", bucket: "today", when: "today",
    dayOffset: 0, repeat: "Weekly", done: false },
  { title: "Submit expenses for March", bucket: "today", when: "today",
    dayOffset: 4, tags: ["admin"], done: false },
  // Evening bucket
  { title: "Reading: Pattern Language ch.7", bucket: "evening", when: "evening",
    projectKey: "reading", done: false },
  { title: "Water plants on balcony", bucket: "evening", when: "evening",
    repeat: "Every 3 days", done: false },
  { title: "Reply to Jun about apartment viewing", bucket: "evening", when: "evening",
    projectKey: "apartment", done: false },
  // Marq Design refresh — In Flight
  { title: "Define new accent token scale", when: "tomorrow", projectKey: "design",
    notes: "Pull samples from Linear, Things, and Bear; cross-check oklch chroma",
    dayOffset: 2, tags: ["tokens"], done: false },
  { title: "Audit shadow / depth tokens", when: "tomorrow", projectKey: "design",
    dayOffset: 2, done: false },
  { title: "Spec liquid-glass surface variants", when: "tomorrow", projectKey: "design",
    dayOffset: 3, tags: ["spec"], done: false },
  { title: "Pair with Inkyu on icon stroke widths", when: "tomorrow", projectKey: "design",
    dayOffset: 4, repeat: "Weekly", done: false },
  // Marq Design — Someday
  { title: "Try woodgrain texture as nav backing", when: "someday", projectKey: "design",
    tags: ["explore"], done: false },
  { title: "Investigate variable font for display", when: "someday", projectKey: "design",
    done: false },
  // Marq Design — Logbook
  { title: "Kickoff doc + scope", when: "today", projectKey: "design", done: true },
  { title: "Stakeholder interviews (4)", when: "today", projectKey: "design", done: true },
  { title: "Competitive teardown deck", when: "today", projectKey: "design", done: true },
  // Inbox
  { title: "Shortcut for quickly creating recurring tasks", when: "inbox", done: false },
  { title: "Find cafe for next 1:1 with Mira", when: "inbox", done: false },
  { title: "Draft trip itinerary for Jeju", when: "inbox", done: false },
  // Anytime
  { title: "Read draft from team retrospective", when: "anytime", projectKey: "okr", done: false },
  { title: "Try the new ramen place", when: "anytime", projectKey: "cooking", done: false },
  // Someday
  { title: "Plan a weekend in Busan", when: "someday", projectKey: "apartment", done: false },
  { title: "Learn how to make handmade pasta", when: "someday", projectKey: "cooking", done: false },
  // Other projects
  { title: "Compile brand voice samples", when: "tomorrow", projectKey: "brand",
    dayOffset: 3, done: false },
  { title: "Sign lease addendum", when: "tomorrow", projectKey: "apartment",
    dayOffset: 6, done: false },
];
