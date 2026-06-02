"use client";

import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ListChecks,
  Menu,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ConfirmModal } from "./ConfirmModal";
import { CreateTaskForm } from "./CreateTaskForm";
import { EditTaskModal } from "./EditTaskModal";
import { IdeaVaultModal } from "./IdeaVaultModal";
import { PomodoroPanel } from "./PomodoroPanel";
import { StudySidebar } from "./StudySidebar";
import { TaskList } from "./TaskList";
import {
  FOCUS_SECONDS,
  IDEAS_KEY,
  POMODORO_KEY,
  SELECTED_TASK_KEY,
  STATS_KEY,
  TASKS_KEY,
  createId,
  emptyIdeaForm,
  emptyTaskForm,
  getDurationForMode,
  initialTasks,
  readLocalStorage,
} from "./storage";
import type {
  DeleteConfirmationState,
  IdeaVaultItem,
  PomodoroMode,
  PomodoroState,
  ProductivityStats,
  StudyRoute,
  StudyTask,
  TaskFormState,
} from "./types";

const routeMeta: Record<
  StudyRoute,
  { title: string; badge: string; description: string }
> = {
  today: {
    title: "Today's Focus",
    badge: "Pomodoro",
    description: "Plan your study tasks, pick one target, and run focused Pomodoro sessions.",
  },
  upcoming: {
    title: "Upcoming",
    badge: "Planning",
    description: "Keep the next study tasks visible without overbuilding the workflow yet.",
  },
  completed: {
    title: "Completed",
    badge: "Done",
    description: "Review finished work and clean up tasks you no longer need.",
  },
  "ai-chat": {
    title: "AI Chat",
    badge: "Soon",
    description: "A secondary study assistant space will live here later.",
  },
  "mind-map": {
    title: "Mind Map",
    badge: "Soon",
    description: "A visual mapping workspace will live here later.",
  },
  "review-cards": {
    title: "Review Cards",
    badge: "Soon",
    description: "Spaced review and flashcard tools will live here later.",
  },
};

const soonPages: Record<
  Exclude<StudyRoute, "today" | "upcoming" | "completed">,
  { icon: typeof Sparkles; title: string; body: string }
> = {
  "ai-chat": {
    icon: Sparkles,
    title: "AI Chat is coming soon",
    body: "This stays secondary to the task and Pomodoro workflow until the core study loop is ready.",
  },
  "mind-map": {
    icon: BarChart3,
    title: "Mind Map is coming soon",
    body: "This page is reserved for organizing concepts visually without taking over the Today dashboard.",
  },
  "review-cards": {
    icon: ListChecks,
    title: "Review Cards are coming soon",
    body: "This page is reserved for review sessions and recall practice.",
  },
};

export default function StudyModeView({ view = "today" }: { view?: StudyRoute }) {
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
  const [editTaskForm, setEditTaskForm] = useState<TaskFormState>(emptyTaskForm);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>(null);
  const [isIdeaVaultOpen, setIsIdeaVaultOpen] = useState(false);
  const [ideas, setIdeas] = useState<IdeaVaultItem[]>([]);
  const [ideaForm, setIdeaForm] = useState(emptyIdeaForm);

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

  const finishCurrentSession = useCallback(() => {
    const activeMode = pomodoro.mode;
    const taskId = selectedTaskId;

    if (activeMode !== "focus") {
      setPomodoro((current) => ({
        ...current,
        mode: "focus",
        isRunning: false,
        remainingSeconds: FOCUS_SECONDS,
      }));
      return;
    }

    if (!taskId) {
      setPomodoro((current) => ({
        ...current,
        isRunning: false,
        remainingSeconds: FOCUS_SECONDS,
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
  }, [pomodoro.mode, selectedTaskId]);

  useEffect(() => {
    if (!pomodoro.isRunning) return;

    const intervalId = window.setInterval(() => {
      setPomodoro((current) => {
        if (!current.isRunning) return current;
        if (current.remainingSeconds <= 1) {
          window.setTimeout(finishCurrentSession, 0);
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
  }, [finishCurrentSession, pomodoro.isRunning]);

  const selectTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setPomodoro((current) => ({
      ...current,
      selectedTaskId: taskId,
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
  };

  const closeEditTaskModal = () => {
    setEditingTaskId(null);
    setEditTaskForm(emptyTaskForm);
  };

  const handleTaskSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = taskForm.title.trim();
    if (!title) return;

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
    if (task.status === "done") return;
    setEditingTaskId(task.id);
    setEditTaskForm({
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      estimatedPomodoros: task.estimatedPomodoros,
    });
  };

  const saveEditedTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTaskId) return;

    const title = editTaskForm.title.trim();
    if (!title) return;

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              title,
              description: editTaskForm.description.trim(),
              priority: editTaskForm.priority,
              estimatedPomodoros: Math.max(1, editTaskForm.estimatedPomodoros),
              updatedAt: Date.now(),
            }
          : task,
      ),
    );
    closeEditTaskModal();
  };

  const deleteTask = (taskId: string) => {
    const remainingTasks = tasks.filter((task) => task.id !== taskId);
    setTasks(remainingTasks);
    if (selectedTaskId === taskId) {
      const fallbackTask = remainingTasks.find((task) => task.status !== "done");
      const fallbackId = fallbackTask?.id ?? null;
      setSelectedTaskId(fallbackId);
      setPomodoro((current) => ({
        ...current,
        selectedTaskId: fallbackId,
        isRunning: false,
      }));
    }
  };

  const requestDeleteTask = (task: StudyTask) => {
    setDeleteConfirmation({
      title: task.status === "done" ? "Delete completed task?" : "Delete task?",
      message: `"${task.title}" will be removed from this study plan.`,
      confirmLabel: "Delete Task",
      onConfirm: () => deleteTask(task.id),
    });
  };

  const deleteIdea = (ideaId: string) => {
    setIdeas((currentIdeas) => currentIdeas.filter((item) => item.id !== ideaId));
  };

  const requestDeleteIdea = (idea: IdeaVaultItem) => {
    setDeleteConfirmation({
      title: "Delete idea?",
      message: `"${idea.title}" will be removed from your Idea Vault.`,
      confirmLabel: "Delete Idea",
      onConfirm: () => deleteIdea(idea.id),
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    deleteConfirmation.onConfirm();
    setDeleteConfirmation(null);
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
      remainingSeconds:
        current.remainingSeconds <= 0 ? getDurationForMode(current.mode) : current.remainingSeconds,
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

  const submitIdea = (event: FormEvent<HTMLFormElement>) => {
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

  const commonTaskListProps = {
    selectedTaskId,
    onSelectTask: selectTask,
    onEditTask: editTask,
    onDeleteTask: requestDeleteTask,
    onMarkDone: markTaskDone,
  };

  const renderContent = () => {
    if (view === "completed") {
      return (
        <div className="max-w-4xl">
          <TaskList
            title="Completed Tasks"
            subtitle="Finished work stays visible for daily momentum."
            tasks={completedTasks}
            emptyText="No completed tasks yet."
            {...commonTaskListProps}
          />
        </div>
      );
    }

    if (view === "upcoming") {
      return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <TaskList
            title="Upcoming Queue"
            subtitle="Tasks waiting for a focused study slot."
            tasks={activeTasks}
            emptyText="No upcoming tasks yet."
            {...commonTaskListProps}
          />
          <PlaceholderCard
            icon={CalendarClock}
            title="Light planning for now"
            body="This route is wired up, but scheduling and calendar views can wait until the core task flow needs them."
          />
        </div>
      );
    }

    if (view !== "today") {
      const page = soonPages[view];
      return <PlaceholderCard icon={page.icon} title={page.title} body={page.body} />;
    }

    return (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="space-y-5">
          <CreateTaskForm
            taskForm={taskForm}
            setTaskForm={setTaskForm}
            onSubmit={handleTaskSubmit}
          />
          <TaskList
            title="Active Tasks"
            subtitle="Pick the task you want the timer to work on."
            tasks={activeTasks}
            {...commonTaskListProps}
          />
          <TaskList
            title="Completed Tasks"
            subtitle="Finished work stays visible for daily momentum."
            tasks={completedTasks}
            emptyText="No completed tasks yet."
            {...commonTaskListProps}
          />
        </section>

        <PomodoroPanel
          selectedTask={selectedTask}
          pomodoro={pomodoro}
          timerProgress={timerProgress}
          longBreakDue={longBreakDue}
          onSwitchMode={switchMode}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
          onFinish={finishCurrentSession}
        />
      </div>
    );
  };

  const meta = routeMeta[view];

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-[#111722] text-white">
      <div className="flex h-full min-h-0 overflow-hidden">
        <StudySidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          stats={stats}
          longBreakDue={longBreakDue}
        />

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
                    <h1 className="text-xl font-semibold text-white">{meta.title}</h1>
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-300">
                      {meta.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#92a4c9]">{meta.description}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(19,91,236,0.16),transparent_34rem)] p-4 [scrollbar-color:#33415f_#111722] [scrollbar-width:thin] sm:p-6">
            {renderContent()}
          </div>
        </main>
      </div>

      <IdeaVaultModal
        isOpen={isIdeaVaultOpen}
        ideas={ideas}
        ideaForm={ideaForm}
        setIdeaForm={setIdeaForm}
        onOpen={() => setIsIdeaVaultOpen(true)}
        onClose={() => setIsIdeaVaultOpen(false)}
        onSubmit={submitIdea}
        onRequestDeleteIdea={requestDeleteIdea}
      />
      <EditTaskModal
        isOpen={Boolean(editingTaskId)}
        editTaskForm={editTaskForm}
        setEditTaskForm={setEditTaskForm}
        onClose={closeEditTaskModal}
        onSubmit={saveEditedTask}
      />
      <ConfirmModal
        confirmation={deleteConfirmation}
        onCancel={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function PlaceholderCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <section className="rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-6 shadow-xl shadow-black/15 backdrop-blur">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300 shadow-[0_0_20px_rgba(19,91,236,0.2)]">
          <Icon size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#92a4c9]">{body}</p>
        </div>
      </div>
    </section>
  );
}
