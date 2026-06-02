"use client";

import {
  ArrowLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock3,
  Edit3,
  Flame,
  Lightbulb,
  ListChecks,
  Menu,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  TimerReset,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "active" | "done";
export type PomodoroMode = "focus" | "short-break" | "long-break";

export interface StudyTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  estimatedPomodoros: number;
  completedPomodoros: number;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
}

export interface PomodoroState {
  mode: PomodoroMode;
  remainingSeconds: number;
  isRunning: boolean;
  selectedTaskId: string | null;
  completedFocusSessions: number;
}

export interface IdeaVaultItem {
  id: string;
  title: string;
  note: string;
  tag?: string;
  createdAt: number;
}

export interface ProductivityStats {
  totalTasksToday: number;
  completedTasks: number;
  totalFocusSessions: number;
}

type TaskFormState = {
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedPomodoros: number;
};

type IdeaFormState = {
  title: string;
  note: string;
  tag: string;
};

const TASKS_KEY = "solstudy-tasks";
const SELECTED_TASK_KEY = "solstudy-selected-task-id";
const POMODORO_KEY = "solstudy-pomodoro-state";
const IDEAS_KEY = "solstudy-ideas";
const STATS_KEY = "solstudy-productivity-stats";

const FOCUS_SECONDS = 25 * 60;
const SHORT_BREAK_SECONDS = 5 * 60;
const LONG_BREAK_SECONDS = 15 * 60;

const emptyTaskForm: TaskFormState = {
  title: "",
  description: "",
  priority: "medium",
  estimatedPomodoros: 2,
};

const emptyIdeaForm: IdeaFormState = {
  title: "",
  note: "",
  tag: "",
};

const initialTasks: StudyTask[] = [
  {
    id: "task-seed-1",
    title: "Outline biology chapter notes",
    description: "Create a concise structure before reading details.",
    priority: "high",
    estimatedPomodoros: 2,
    completedPomodoros: 1,
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "task-seed-2",
    title: "Solve practice questions",
    description: "Focus on the five hardest questions from the last set.",
    priority: "medium",
    estimatedPomodoros: 3,
    completedPomodoros: 0,
    status: "todo",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "task-seed-3",
    title: "Review flashcard misses",
    description: "Turn recurring mistakes into one-line rules.",
    priority: "low",
    estimatedPomodoros: 1,
    completedPomodoros: 1,
    status: "done",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDurationForMode(mode: PomodoroMode) {
  if (mode === "short-break") return SHORT_BREAK_SECONDS;
  if (mode === "long-break") return LONG_BREAK_SECONDS;
  return FOCUS_SECONDS;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function priorityStyles(priority: TaskPriority) {
  if (priority === "high") {
    return "border-red-400/30 bg-red-500/10 text-red-200";
  }
  if (priority === "medium") {
    return "border-blue-400/30 bg-blue-500/10 text-blue-200";
  }
  return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
}

function statusStyles(status: TaskStatus) {
  if (status === "done") {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }
  if (status === "active") {
    return "border-blue-400/30 bg-blue-500/10 text-blue-200";
  }
  return "border-[#33415f] bg-[#232f48] text-[#92a4c9]";
}

function modeLabel(mode: PomodoroMode) {
  if (mode === "short-break") return "Short Break";
  if (mode === "long-break") return "Long Break";
  return "Focus";
}

export default function StudyModeView() {
  const router = useRouter();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tasks, setTasks] = useState<StudyTask[]>(initialTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialTasks[0]?.id ?? null);
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    mode: "focus",
    remainingSeconds: FOCUS_SECONDS,
    isRunning: false,
    selectedTaskId: initialTasks[0]?.id ?? null,
    completedFocusSessions: 0,
  });
  const [stats, setStats] = useState<ProductivityStats>({
    totalTasksToday: initialTasks.length,
    completedTasks: initialTasks.filter((task) => task.status === "done").length,
    totalFocusSessions: 0,
  });
  const [taskForm, setTaskForm] = useState<TaskFormState>(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isIdeaVaultOpen, setIsIdeaVaultOpen] = useState(false);
  const [ideas, setIdeas] = useState<IdeaVaultItem[]>([]);
  const [ideaForm, setIdeaForm] = useState<IdeaFormState>(emptyIdeaForm);

  useEffect(() => {
    const loadedTasks = readLocalStorage<StudyTask[]>(TASKS_KEY, initialTasks);
    const loadedSelectedTaskId = readLocalStorage<string | null>(
      SELECTED_TASK_KEY,
      loadedTasks.find((task) => task.status !== "done")?.id ?? null,
    );
    const loadedPomodoro = readLocalStorage<PomodoroState>(POMODORO_KEY, {
      mode: "focus",
      remainingSeconds: FOCUS_SECONDS,
      isRunning: false,
      selectedTaskId: loadedSelectedTaskId,
      completedFocusSessions: 0,
    });

    setTasks(loadedTasks);
    setSelectedTaskId(loadedSelectedTaskId);
    setPomodoro({
      ...loadedPomodoro,
      selectedTaskId: loadedSelectedTaskId,
      isRunning: false,
    });
    setIdeas(readLocalStorage<IdeaVaultItem[]>(IDEAS_KEY, []));
    setStats(
      readLocalStorage<ProductivityStats>(STATS_KEY, {
        totalTasksToday: loadedTasks.length,
        completedTasks: loadedTasks.filter((task) => task.status === "done").length,
        totalFocusSessions: loadedPomodoro.completedFocusSessions,
      }),
    );
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    setStats((current) => ({
      ...current,
      totalTasksToday: tasks.length,
      completedTasks: tasks.filter((task) => task.status === "done").length,
    }));
  }, [hasLoaded, tasks]);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(SELECTED_TASK_KEY, JSON.stringify(selectedTaskId));
  }, [hasLoaded, selectedTaskId]);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(POMODORO_KEY, JSON.stringify(pomodoro));
  }, [hasLoaded, pomodoro]);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas));
  }, [hasLoaded, ideas]);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [hasLoaded, stats]);

  const completeFocusSession = useCallback(() => {
    const taskId = selectedTaskId;
    if (!taskId) {
      setPomodoro((current) => ({
        ...current,
        isRunning: false,
        remainingSeconds: getDurationForMode(current.mode),
      }));
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) return task;
        const nextCompletedPomodoros = Math.min(
          task.completedPomodoros + 1,
          Math.max(task.estimatedPomodoros, task.completedPomodoros + 1),
        );
        return {
          ...task,
          completedPomodoros: nextCompletedPomodoros,
          status:
            task.status === "done"
              ? "done"
              : nextCompletedPomodoros >= task.estimatedPomodoros
                ? "done"
                : "active",
          updatedAt: Date.now(),
        };
      }),
    );

    setStats((current) => ({
      ...current,
      totalFocusSessions: current.totalFocusSessions + 1,
    }));

    setPomodoro((current) => {
      const completedFocusSessions = current.completedFocusSessions + 1;
      const nextMode: PomodoroMode =
        completedFocusSessions % 4 === 0 ? "long-break" : "short-break";
      return {
        mode: nextMode,
        remainingSeconds: getDurationForMode(nextMode),
        isRunning: false,
        selectedTaskId: taskId,
        completedFocusSessions,
      };
    });
  }, [selectedTaskId]);

  useEffect(() => {
    if (!pomodoro.isRunning) return;

    const intervalId = window.setInterval(() => {
      setPomodoro((current) => {
        if (!current.isRunning) return current;
        if (current.remainingSeconds <= 1) {
          window.setTimeout(completeFocusSession, 0);
          return {
            ...current,
            remainingSeconds: 0,
            isRunning: false,
          };
        }
        return {
          ...current,
          remainingSeconds: current.remainingSeconds - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [completeFocusSession, pomodoro.isRunning]);

  const activeTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done").sort((a, b) => b.updatedAt - a.updatedAt),
    [tasks],
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === "done").sort((a, b) => b.updatedAt - a.updatedAt),
    [tasks],
  );
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );
  const timerProgress =
    1 - pomodoro.remainingSeconds / Math.max(getDurationForMode(pomodoro.mode), 1);
  const longBreakDue =
    pomodoro.completedFocusSessions > 0 && pomodoro.completedFocusSessions % 4 === 0;

  const selectTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setPomodoro((current) => ({
      ...current,
      selectedTaskId: taskId,
      mode: current.mode === "focus" ? current.mode : "focus",
      remainingSeconds: current.mode === "focus" ? current.remainingSeconds : FOCUS_SECONDS,
    }));
    setTasks((currentTasks) =>
      currentTasks.map((task) => ({
        ...task,
        status:
          task.id === taskId
            ? task.status === "done"
              ? "done"
              : "active"
            : task.status === "active"
              ? "todo"
              : task.status,
        updatedAt: task.id === taskId ? Date.now() : task.updatedAt,
      })),
    );
  }, []);

  const resetTaskForm = () => {
    setTaskForm(emptyTaskForm);
    setEditingTaskId(null);
  };

  const handleTaskSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = taskForm.title.trim();
    if (!title) return;

    if (editingTaskId) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title,
                description: taskForm.description.trim(),
                priority: taskForm.priority,
                estimatedPomodoros: Math.max(1, taskForm.estimatedPomodoros),
                updatedAt: Date.now(),
              }
            : task,
        ),
      );
      resetTaskForm();
      return;
    }

    const newTask: StudyTask = {
      id: createId("task"),
      title,
      description: taskForm.description.trim(),
      priority: taskForm.priority,
      estimatedPomodoros: Math.max(1, taskForm.estimatedPomodoros),
      completedPomodoros: 0,
      status: "todo",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTasks((currentTasks) => [newTask, ...currentTasks]);
    selectTask(newTask.id);
    resetTaskForm();
  };

  const editTask = (task: StudyTask) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      estimatedPomodoros: task.estimatedPomodoros,
    });
  };

  const deleteTask = (taskId: string) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    if (selectedTaskId === taskId) {
      const fallbackTask = tasks.find((task) => task.id !== taskId && task.status !== "done");
      const fallbackId = fallbackTask?.id ?? null;
      setSelectedTaskId(fallbackId);
      setPomodoro((current) => ({
        ...current,
        selectedTaskId: fallbackId,
        isRunning: false,
      }));
    }
  };

  const markTaskDone = (taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "done",
              completedPomodoros: Math.max(task.completedPomodoros, task.estimatedPomodoros),
              updatedAt: Date.now(),
            }
          : task,
      ),
    );
    setPomodoro((current) =>
      current.selectedTaskId === taskId
        ? {
            ...current,
            isRunning: false,
          }
        : current,
    );
  };

  const startTimer = () => {
    if (!selectedTask) return;
    selectTask(selectedTask.id);
    setPomodoro((current) => ({
      ...current,
      mode: current.remainingSeconds === 0 ? "focus" : current.mode,
      remainingSeconds: current.remainingSeconds === 0 ? FOCUS_SECONDS : current.remainingSeconds,
      selectedTaskId: selectedTask.id,
      isRunning: true,
    }));
  };

  const pauseTimer = () => {
    setPomodoro((current) => ({ ...current, isRunning: false }));
  };

  const resetTimer = () => {
    setPomodoro((current) => ({
      ...current,
      isRunning: false,
      remainingSeconds: getDurationForMode(current.mode),
    }));
  };

  const switchMode = (mode: PomodoroMode) => {
    setPomodoro((current) => ({
      ...current,
      mode,
      isRunning: false,
      remainingSeconds: getDurationForMode(mode),
    }));
  };

  const submitIdea = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = ideaForm.title.trim();
    const note = ideaForm.note.trim();
    if (!title || !note) return;

    setIdeas((currentIdeas) => [
      {
        id: createId("idea"),
        title,
        note,
        tag: ideaForm.tag.trim() || undefined,
        createdAt: Date.now(),
      },
      ...currentIdeas,
    ]);
    setIdeaForm(emptyIdeaForm);
  };

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-[#111722] text-white">
      <div className="flex h-full min-h-0 overflow-hidden">
        <AnimatePresence initial={false}>
          {sidebarOpen ? (
            <motion.aside
              key="productivity-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 292, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden h-full shrink-0 overflow-hidden border-r border-[#232f48] bg-[#111722]/95 shadow-2xl shadow-black/20 backdrop-blur md:flex md:flex-col"
            >
              <div className="border-b border-[#232f48] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-300 shadow-[0_0_24px_rgba(19,91,236,0.28)]">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">SolStudy</p>
                      <p className="text-xs text-[#556987]">Productivity mode</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                    aria-label="Collapse sidebar"
                  >
                    <X size={18} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetTaskForm();
                    window.setTimeout(() => document.getElementById("task-title-input")?.focus(), 0);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(19,91,236,0.35)] transition hover:bg-blue-500"
                >
                  <Plus size={17} />
                  New Task
                </button>
              </div>

              <nav className="space-y-1 border-b border-[#232f48] p-3">
                {[
                  { label: "Today", icon: Target, active: true },
                  { label: "Upcoming", icon: CalendarClock, active: false },
                  { label: "Completed", icon: CheckCircle2, active: false },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.label}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      item.active
                        ? "border-blue-500/40 bg-blue-600/15 text-white"
                        : "border-transparent text-[#92a4c9] hover:border-[#232f48] hover:bg-[#1a2332] hover:text-white"
                    }`}
                  >
                    <item.icon size={17} />
                    {item.label}
                  </button>
                ))}
                {[
                  { label: "AI Chat", icon: Sparkles },
                  { label: "Mind Map", icon: BarChart3 },
                  { label: "Review Cards", icon: ListChecks },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.label}
                    className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-[#92a4c9] transition hover:border-[#232f48] hover:bg-[#1a2332] hover:text-white"
                  >
                    <span className="flex items-center gap-3">
                      <item.icon size={17} />
                      {item.label}
                    </span>
                    <span className="rounded-full bg-[#232f48] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#556987]">
                      Soon
                    </span>
                  </button>
                ))}
              </nav>

              <div className="space-y-3 p-4">
                <div className="rounded-2xl border border-[#232f48] bg-[#1a2332] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
                    Today Stats
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-[#111722] p-3 text-center">
                      <p className="text-lg font-semibold text-white">{stats.totalTasksToday}</p>
                      <p className="mt-1 text-[10px] text-[#92a4c9]">Tasks</p>
                    </div>
                    <div className="rounded-xl bg-[#111722] p-3 text-center">
                      <p className="text-lg font-semibold text-emerald-300">{stats.completedTasks}</p>
                      <p className="mt-1 text-[10px] text-[#92a4c9]">Done</p>
                    </div>
                    <div className="rounded-xl bg-[#111722] p-3 text-center">
                      <p className="text-lg font-semibold text-blue-300">{stats.totalFocusSessions}</p>
                      <p className="mt-1 text-[10px] text-[#92a4c9]">Focus</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
                      <Flame size={19} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Focus Rhythm</p>
                      <p className="text-xs text-[#92a4c9]">
                        {longBreakDue ? "Long break is due" : "Work in 25 minute sprints"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-[#232f48] bg-[#111722]/90 p-3 backdrop-blur sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                {!sidebarOpen ? (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                    aria-label="Open sidebar"
                  >
                    <Menu size={20} />
                  </button>
                ) : null}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-white">Today's Focus</h1>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-300">
                      Pomodoro
                    </span>
                  </div>
                  <p className="text-xs text-[#92a4c9]">
                    Plan your study tasks, pick one target, and run focused Pomodoro sessions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#232f48] bg-[#1a2332] p-2">
                <div className="px-3 py-1.5 text-center">
                  <p className="text-sm font-semibold text-white">{activeTasks.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#556987]">Active</p>
                </div>
                <div className="px-3 py-1.5 text-center">
                  <p className="text-sm font-semibold text-emerald-300">{completedTasks.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#556987]">Done</p>
                </div>
                <div className="px-3 py-1.5 text-center">
                  <p className="text-sm font-semibold text-blue-300">{pomodoro.completedFocusSessions}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#556987]">Cycles</p>
                </div>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(19,91,236,0.16),transparent_34rem)] p-4 sm:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
              <section className="space-y-5">
                <form
                  onSubmit={handleTaskSubmit}
                  className="rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-4 shadow-2xl shadow-black/15 backdrop-blur sm:p-5"
                >
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-white">
                        {editingTaskId ? "Edit Task" : "Create Task"}
                      </h2>
                      <p className="text-sm text-[#92a4c9]">
                        Define a clear output before starting the timer.
                      </p>
                    </div>
                    {editingTaskId ? (
                      <button
                        type="button"
                        onClick={resetTaskForm}
                        className="rounded-xl border border-[#232f48] px-3 py-2 text-sm font-semibold text-[#92a4c9] transition hover:text-white"
                      >
                        Cancel Edit
                      </button>
                    ) : null}
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_8rem]">
                    <div className="space-y-2">
                      <label htmlFor="task-title-input" className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
                        Task title
                      </label>
                      <input
                        id="task-title-input"
                        value={taskForm.title}
                        onChange={(event) =>
                          setTaskForm((current) => ({ ...current, title: event.target.value }))
                        }
                        placeholder="What needs focus?"
                        className="h-11 w-full rounded-xl border border-[#232f48] bg-[#111722] px-3 text-sm text-white outline-none transition placeholder:text-[#556987] focus:border-blue-500/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="task-priority-input" className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
                        Priority
                      </label>
                      <select
                        id="task-priority-input"
                        value={taskForm.priority}
                        onChange={(event) =>
                          setTaskForm((current) => ({
                            ...current,
                            priority: event.target.value as TaskPriority,
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-[#232f48] bg-[#111722] px-3 text-sm text-white outline-none transition focus:border-blue-500/60"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="task-estimate-input" className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
                        Pomos
                      </label>
                      <input
                        id="task-estimate-input"
                        type="number"
                        min={1}
                        max={12}
                        value={taskForm.estimatedPomodoros}
                        onChange={(event) =>
                          setTaskForm((current) => ({
                            ...current,
                            estimatedPomodoros: Number(event.target.value),
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-[#232f48] bg-[#111722] px-3 text-sm text-white outline-none transition focus:border-blue-500/60"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_9rem]">
                    <textarea
                      value={taskForm.description}
                      onChange={(event) =>
                        setTaskForm((current) => ({ ...current, description: event.target.value }))
                      }
                      placeholder="Optional description"
                      rows={3}
                      className="w-full resize-none rounded-xl border border-[#232f48] bg-[#111722] px-3 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#556987] focus:border-blue-500/60"
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(19,91,236,0.35)] transition hover:bg-blue-500"
                    >
                      <Plus size={17} />
                      {editingTaskId ? "Save" : "Add Task"}
                    </button>
                  </div>
                </form>

                <TaskSection
                  title="Active Tasks"
                  subtitle="Pick the task you want the timer to work on."
                  tasks={activeTasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={selectTask}
                  onEditTask={editTask}
                  onDeleteTask={deleteTask}
                  onMarkDone={markTaskDone}
                />

                <TaskSection
                  title="Completed Tasks"
                  subtitle="Finished work stays visible for daily momentum."
                  tasks={completedTasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={selectTask}
                  onEditTask={editTask}
                  onDeleteTask={deleteTask}
                  onMarkDone={markTaskDone}
                  emptyText="No completed tasks yet."
                />
              </section>

              <aside className="space-y-5">
                <section className="sticky top-0 rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-5 shadow-2xl shadow-black/20 backdrop-blur">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                        Pomodoro Panel
                      </p>
                      <h2 className="mt-1 text-lg font-semibold text-white">{modeLabel(pomodoro.mode)}</h2>
                    </div>
                    <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300 shadow-[0_0_24px_rgba(19,91,236,0.22)]">
                      <Clock3 size={22} />
                    </div>
                  </div>

                  {selectedTask ? (
                    <>
                      <div className="mb-5 rounded-2xl border border-[#232f48] bg-[#111722] p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
                          Selected Task
                        </p>
                        <h3 className="mt-2 text-base font-semibold text-white">{selectedTask.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#92a4c9]">
                          {selectedTask.description || "No description added."}
                        </p>
                      </div>

                      <div className="relative mx-auto mb-5 flex aspect-square max-w-[17rem] items-center justify-center rounded-full border border-[#232f48] bg-[#111722] shadow-inner">
                        <div
                          className="absolute inset-3 rounded-full"
                          style={{
                            background: `conic-gradient(#135bec ${Math.max(timerProgress, 0) * 360}deg, #232f48 0deg)`,
                          }}
                        />
                        <div className="absolute inset-6 rounded-full bg-[#111722]" />
                        <div className="relative text-center">
                          <p className="text-5xl font-semibold tracking-tight text-white">
                            {formatTime(pomodoro.remainingSeconds)}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-wider text-[#92a4c9]">
                            {pomodoro.isRunning ? "Running" : "Paused"}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4 grid grid-cols-3 gap-2">
                        {(["focus", "short-break", "long-break"] as const).map((mode) => (
                          <button
                            type="button"
                            key={mode}
                            onClick={() => switchMode(mode)}
                            className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                              pomodoro.mode === mode
                                ? "border-blue-500/50 bg-blue-600 text-white"
                                : "border-[#232f48] bg-[#111722] text-[#92a4c9] hover:text-white"
                            }`}
                          >
                            {modeLabel(mode)}
                          </button>
                        ))}
                      </div>

                      {longBreakDue ? (
                        <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                          Four focus sessions completed. Take the long break before the next sprint.
                        </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-2">
                        {pomodoro.isRunning ? (
                          <button
                            type="button"
                            onClick={pauseTimer}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#232f48] bg-[#111722] px-3 py-3 text-sm font-semibold text-[#c5d3ef] transition hover:text-white"
                          >
                            <Pause size={17} />
                            Pause
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={startTimer}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(19,91,236,0.35)] transition hover:bg-blue-500"
                          >
                            <Play size={17} />
                            {pomodoro.remainingSeconds === getDurationForMode(pomodoro.mode)
                              ? "Start"
                              : "Resume"}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={resetTimer}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#232f48] bg-[#111722] px-3 py-3 text-sm font-semibold text-[#c5d3ef] transition hover:text-white"
                        >
                          <RotateCcw size={17} />
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={completeFocusSession}
                          disabled={pomodoro.mode !== "focus"}
                          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          <TimerReset size={17} />
                          Finish Session
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#232f48] bg-[#111722] p-8 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
                        <Target size={26} />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Select a task to start focusing.</h3>
                      <p className="mt-2 text-sm leading-6 text-[#92a4c9]">
                        Add a task or choose one from the active list, then start the timer.
                      </p>
                    </div>
                  )}
                </section>
              </aside>
            </div>
          </div>
        </main>
      </div>

      <button
        type="button"
        onClick={() => setIsIdeaVaultOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-600 text-white shadow-[0_0_34px_rgba(19,91,236,0.48)] transition hover:bg-blue-500"
        aria-label="Open Idea Vault"
      >
        <Lightbulb size={23} />
      </button>

      <AnimatePresence>
        {isIdeaVaultOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsIdeaVaultOpen(false)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#232f48] bg-[#1a2332] shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-[#232f48] p-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">Idea Vault</h2>
                  <p className="mt-1 text-sm text-[#92a4c9]">
                    Save quick thoughts without breaking your focus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsIdeaVaultOpen(false)}
                  className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                  aria-label="Close Idea Vault"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[calc(90vh-5rem)] overflow-y-auto p-5">
                <form onSubmit={submitIdea} className="rounded-2xl border border-[#232f48] bg-[#111722] p-4">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                    <input
                      value={ideaForm.title}
                      onChange={(event) =>
                        setIdeaForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Idea title"
                      className="h-11 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 text-sm text-white outline-none placeholder:text-[#556987] focus:border-blue-500/60"
                    />
                    <input
                      value={ideaForm.tag}
                      onChange={(event) =>
                        setIdeaForm((current) => ({ ...current, tag: event.target.value }))
                      }
                      placeholder="Optional tag"
                      className="h-11 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 text-sm text-white outline-none placeholder:text-[#556987] focus:border-blue-500/60"
                    />
                  </div>
                  <textarea
                    value={ideaForm.note}
                    onChange={(event) =>
                      setIdeaForm((current) => ({ ...current, note: event.target.value }))
                    }
                    placeholder="Write the thought quickly..."
                    rows={3}
                    className="mt-3 w-full resize-none rounded-xl border border-[#232f48] bg-[#1a2332] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-[#556987] focus:border-blue-500/60"
                  />
                  <button
                    type="submit"
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    <Plus size={16} />
                    Add Idea
                  </button>
                </form>

                <div className="mt-5 space-y-3">
                  {ideas.length ? (
                    ideas.map((idea) => (
                      <div key={idea.id} className="rounded-2xl border border-[#232f48] bg-[#111722] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-white">{idea.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-[#92a4c9]">{idea.note}</p>
                            {idea.tag ? (
                              <span className="mt-3 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-200">
                                {idea.tag}
                              </span>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setIdeas((currentIdeas) =>
                                currentIdeas.filter((item) => item.id !== idea.id),
                              )
                            }
                            className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-red-500/10 hover:text-red-300"
                            aria-label={`Delete ${idea.title}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#232f48] p-6 text-center text-sm text-[#92a4c9]">
                      No ideas saved yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function TaskSection({
  title,
  subtitle,
  tasks,
  selectedTaskId,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onMarkDone,
  emptyText = "No active tasks yet.",
}: {
  title: string;
  subtitle: string;
  tasks: StudyTask[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (taskId: string) => void;
  onMarkDone: (taskId: string) => void;
  emptyText?: string;
}) {
  return (
    <section className="rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-4 shadow-2xl shadow-black/15 backdrop-blur sm:p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-sm text-[#92a4c9]">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={task.id === selectedTaskId}
              onSelect={() => onSelectTask(task.id)}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
              onMarkDone={() => onMarkDone(task.id)}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#232f48] bg-[#111722] p-6 text-center text-sm text-[#92a4c9]">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}

function TaskCard({
  task,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onMarkDone,
}: {
  task: StudyTask;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkDone: () => void;
}) {
  const progress = Math.min(
    100,
    Math.round((task.completedPomodoros / Math.max(task.estimatedPomodoros, 1)) * 100),
  );

  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        isSelected
          ? "border-blue-500/60 bg-blue-600/10 shadow-[0_0_28px_rgba(19,91,236,0.22)]"
          : "border-[#232f48] bg-[#111722] hover:border-blue-500/30"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[#92a4c9]">
              {task.status === "done" ? <CheckCircle2 size={18} /> : <Circle size={18} />}
            </span>
            <h3 className="font-semibold text-white">{task.title}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityStyles(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyles(task.status)}`}>
              {task.status}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#92a4c9]">
            {task.description || "No description added."}
          </p>
        </button>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onSelect}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-500"
          >
            <Play size={14} />
            Start Focus
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl border border-[#232f48] p-2 text-[#92a4c9] transition hover:text-white"
            aria-label={`Edit ${task.title}`}
          >
            <Edit3 size={15} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-[#232f48] p-2 text-[#92a4c9] transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 size={15} />
          </button>
          {task.status !== "done" ? (
            <button
              type="button"
              onClick={onMarkDone}
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-2 text-emerald-200 transition hover:bg-emerald-400/15"
              aria-label={`Mark ${task.title} done`}
            >
              <CheckCircle2 size={15} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-[#92a4c9]">
            <span>Progress</span>
            <span>
              {task.completedPomodoros}/{task.estimatedPomodoros} Pomodoros
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#1a2332]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 py-2 text-xs font-semibold text-[#c5d3ef]">
          <Clock3 size={14} className="text-blue-300" />
          Est. {task.estimatedPomodoros}
        </div>
      </div>
    </article>
  );
}
