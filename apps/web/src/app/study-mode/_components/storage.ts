import type { PomodoroMode, StudyTask, TaskPriority, TaskStatus } from "./types";

export const TASKS_KEY = "solstudy-tasks";
export const SELECTED_TASK_KEY = "solstudy-selected-task-id";
export const POMODORO_KEY = "solstudy-pomodoro-state";
export const IDEAS_KEY = "solstudy-ideas";
export const STATS_KEY = "solstudy-productivity-stats";

export const FOCUS_SECONDS = 25 * 60;
export const SHORT_BREAK_SECONDS = 5 * 60;
export const LONG_BREAK_SECONDS = 15 * 60;

export const emptyTaskForm = {
  categoryId: "",
  title: "",
  description: "",
  priority: "medium" as TaskPriority,
  estimatedMinutes: "",
};

export const emptyIdeaForm = {
  title: "",
  content: "",
  tag: "",
};

export const initialTasks: StudyTask[] = [
  {
    id: "task-seed-1",
    title: "Outline biology chapter notes",
    description: "Create a concise structure before reading details.",
    priority: "high",
    estimatedMinutes: 50,
    focusedMinutes: 25,
    restMinutes: 0,
    status: "todo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "task-seed-2",
    title: "Solve practice questions",
    description: "Focus on the five hardest questions from the last set.",
    priority: "medium",
    estimatedMinutes: 75,
    focusedMinutes: 0,
    restMinutes: 0,
    status: "todo",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "task-seed-3",
    title: "Review flashcard misses",
    description: "Turn recurring mistakes into one-line rules.",
    priority: "low",
    estimatedMinutes: 25,
    focusedMinutes: 25,
    restMinutes: 5,
    status: "done",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDurationForMode(mode: PomodoroMode) {
  if (mode === "short-break") return SHORT_BREAK_SECONDS;
  if (mode === "long-break") return LONG_BREAK_SECONDS;
  return FOCUS_SECONDS;
}

export function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function priorityStyles(priority: TaskPriority) {
  if (priority === "high") return "border-red-400/30 bg-red-500/10 text-red-200";
  if (priority === "medium") return "border-blue-400/30 bg-blue-500/10 text-blue-200";
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
}

export function statusStyles(status: TaskStatus) {
  if (status === "done") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (status === "active") return "border-blue-400/30 bg-blue-500/10 text-blue-200";
  return "border-[#33415f] bg-[#232f48] text-[#92a4c9]";
}

export function modeLabel(mode: PomodoroMode) {
  if (mode === "short-break") return "Short Break";
  if (mode === "long-break") return "Long Break";
  return "Focus";
}
