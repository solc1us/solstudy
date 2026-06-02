"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarClock,
  ListChecks,
  Menu,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";
import { CategoryManagementModal } from "./CategoryManagementModal";
import { ConfirmModal } from "./ConfirmModal";
import { CreateTaskForm } from "./CreateTaskForm";
import { EditTaskModal } from "./EditTaskModal";
import { IdeaVaultModal } from "./IdeaVaultModal";
import { PomodoroPanel } from "./PomodoroPanel";
import { StudySidebar } from "./StudySidebar";
import { TaskList } from "./TaskList";
import {
  FOCUS_SECONDS,
  POMODORO_KEY,
  SELECTED_TASK_KEY,
  emptyIdeaForm,
  emptyTaskForm,
  getDurationForMode,
  readLocalStorage,
} from "./storage";
import type {
  DeleteConfirmationState,
  IdeaVaultItem,
  PomodoroMode,
  PomodoroState,
  ProductivityStats,
  StudyCategory,
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

type FocusSessionMode = "focus" | "short_break" | "long_break";

function toTime(value: Date | string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

function parseEstimatedMinutes(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.round(parsed);
}

function toFocusSessionMode(mode: PomodoroMode): FocusSessionMode {
  if (mode === "short-break") return "short_break";
  if (mode === "long-break") return "long_break";
  return "focus";
}

function isAuthError(error: unknown) {
  return error instanceof Error && error.message.toLowerCase().includes("authentication");
}

export default function StudyModeView({ view = "today" }: { view?: StudyRoute }) {
  const queryClient = useQueryClient();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    mode: "focus",
    remainingSeconds: FOCUS_SECONDS,
    isRunning: false,
    selectedTaskId: null,
    completedFocusSessions: 0,
  });
  const [taskForm, setTaskForm] = useState<TaskFormState>(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<TaskFormState>(emptyTaskForm);
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>(null);
  const [isIdeaVaultOpen, setIsIdeaVaultOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [ideaForm, setIdeaForm] = useState(emptyIdeaForm);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);

  const tasksQuery = useQuery(trpc.tasks.list.queryOptions(undefined, { retry: false }));
  const categoriesQuery = useQuery(trpc.categories.list.queryOptions(undefined, { retry: false }));
  const ideasQuery = useQuery(trpc.ideas.list.queryOptions(undefined, { retry: false }));

  const invalidateTasks = useCallback(() => {
    return queryClient.invalidateQueries(trpc.tasks.pathFilter());
  }, [queryClient]);

  const invalidateIdeas = useCallback(() => {
    return queryClient.invalidateQueries(trpc.ideas.pathFilter());
  }, [queryClient]);

  const invalidateCategories = useCallback(() => {
    return queryClient.invalidateQueries(trpc.categories.pathFilter());
  }, [queryClient]);

  const onMutationError = useCallback((error: { message: string }) => {
    toast.error(error.message);
  }, []);

  const createTaskMutation = useMutation(
    trpc.tasks.create.mutationOptions({
      onError: onMutationError,
      onSuccess: async (task) => {
        await invalidateTasks();
        if (task?.id) {
          setSelectedTaskId(task.id);
          setPomodoro((current) => ({ ...current, selectedTaskId: task.id }));
        }
      },
    }),
  );
  const updateTaskMutation = useMutation(
    trpc.tasks.update.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateTasks,
    }),
  );
  const deleteTaskMutation = useMutation(
    trpc.tasks.delete.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateTasks,
    }),
  );
  const markDoneMutation = useMutation(
    trpc.tasks.markDone.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateTasks,
    }),
  );
  const restoreTaskMutation = useMutation(
    trpc.tasks.restore.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateTasks,
    }),
  );
  const setStartedMutation = useMutation(
    trpc.tasks.setStarted.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateTasks,
    }),
  );
  const createCategoryMutation = useMutation(
    trpc.categories.create.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateCategories,
    }),
  );
  const updateCategoryMutation = useMutation(
    trpc.categories.update.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateCategories,
    }),
  );
  const deleteCategoryMutation = useMutation(
    trpc.categories.delete.mutationOptions({
      onError: onMutationError,
      onSuccess: async () => {
        await Promise.all([invalidateCategories(), invalidateTasks()]);
      },
    }),
  );
  const completeFocusSessionMutation = useMutation(
    trpc.focusSessions.complete.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateTasks,
    }),
  );
  const createIdeaMutation = useMutation(
    trpc.ideas.create.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateIdeas,
    }),
  );
  const updateIdeaMutation = useMutation(
    trpc.ideas.update.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateIdeas,
    }),
  );
  const deleteIdeaMutation = useMutation(
    trpc.ideas.delete.mutationOptions({
      onError: onMutationError,
      onSuccess: invalidateIdeas,
    }),
  );
  const convertIdeaMutation = useMutation(
    trpc.ideas.convertToTask.mutationOptions({
      onError: onMutationError,
      onSuccess: async (task) => {
        await Promise.all([invalidateIdeas(), invalidateTasks()]);
        if (task?.id) {
          setSelectedTaskId(task.id);
          setPomodoro((current) => ({ ...current, selectedTaskId: task.id }));
        }
      },
    }),
  );

  useEffect(() => {
    const loadedSelectedTaskId = readLocalStorage<string | null>(SELECTED_TASK_KEY, null);
    const loadedPomodoro = readLocalStorage<PomodoroState>(POMODORO_KEY, {
      mode: "focus",
      remainingSeconds: FOCUS_SECONDS,
      isRunning: false,
      selectedTaskId: loadedSelectedTaskId,
      completedFocusSessions: 0,
    });

    // TODO: Add an explicit import flow for legacy solstudy-tasks/solstudy-ideas data.
    setSelectedTaskId(loadedSelectedTaskId);
    setPomodoro({
      ...loadedPomodoro,
      selectedTaskId: loadedSelectedTaskId,
      isRunning: false,
    });
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(SELECTED_TASK_KEY, JSON.stringify(selectedTaskId));
  }, [hasLoaded, selectedTaskId]);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(POMODORO_KEY, JSON.stringify(pomodoro));
  }, [hasLoaded, pomodoro]);

  const tasks = useMemo<StudyTask[]>(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const categories = useMemo<StudyCategory[]>(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const ideas = useMemo<IdeaVaultItem[]>(() => ideasQuery.data ?? [], [ideasQuery.data]);

  const activeTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status !== "done")
        .sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt)),
    [tasks],
  );
  const completedTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status === "done")
        .sort((a, b) => toTime(b.updatedAt) - toTime(a.updatedAt)),
    [tasks],
  );
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );
  const stats = useMemo<ProductivityStats>(
    () => ({
      totalTasksToday: tasks.length,
      completedTasks: completedTasks.length,
      totalFocusSessions: pomodoro.completedFocusSessions,
    }),
    [completedTasks.length, pomodoro.completedFocusSessions, tasks.length],
  );
  const timerProgress =
    1 - pomodoro.remainingSeconds / Math.max(getDurationForMode(pomodoro.mode), 1);
  const longBreakDue =
    pomodoro.completedFocusSessions > 0 && pomodoro.completedFocusSessions % 4 === 0;
  const isLoadingData = tasksQuery.isPending || categoriesQuery.isPending || ideasQuery.isPending;
  const hasAuthError =
    isAuthError(tasksQuery.error) || isAuthError(categoriesQuery.error) || isAuthError(ideasQuery.error);

  useEffect(() => {
    if (!hasLoaded || tasksQuery.isPending) return;

    const selectedTaskIsAvailable =
      selectedTaskId &&
      tasks.some((task) => task.id === selectedTaskId && task.status !== "done");

    if (selectedTaskIsAvailable) return;

    const fallbackId = activeTasks[0]?.id ?? null;
    setSelectedTaskId(fallbackId);
    setPomodoro((current) => ({
      ...current,
      selectedTaskId: fallbackId,
      isRunning: fallbackId ? current.isRunning : false,
    }));
  }, [activeTasks, hasLoaded, selectedTaskId, tasks, tasksQuery.isPending]);

  const finishCurrentSession = useCallback(async () => {
    if (completeFocusSessionMutation.isPending) return;

    const activeMode = pomodoro.mode;
    const taskId = selectedTaskId;
    const durationSeconds = getDurationForMode(activeMode);

    if (!taskId) {
      setPomodoro((current) => ({
        ...current,
        isRunning: false,
        remainingSeconds: durationSeconds,
      }));
      return;
    }

    const elapsedSeconds = Math.max(0, durationSeconds - pomodoro.remainingSeconds);
    const plannedMinutes = Math.round(durationSeconds / 60);
    const actualMinutes =
      pomodoro.remainingSeconds <= 0
        ? plannedMinutes
        : Math.max(1, Math.round(elapsedSeconds / 60));

    try {
      await completeFocusSessionMutation.mutateAsync({
        taskId,
        mode: toFocusSessionMode(activeMode),
        plannedMinutes,
        actualMinutes,
        startedAt: new Date(Date.now() - elapsedSeconds * 1000),
        endedAt: new Date(),
      });
    } catch {
      return;
    }

    if (activeMode !== "focus") {
      setPomodoro((current) => ({
        ...current,
        mode: "focus",
        isRunning: false,
        remainingSeconds: FOCUS_SECONDS,
      }));
      return;
    }

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
  }, [
    completeFocusSessionMutation,
    pomodoro.mode,
    pomodoro.remainingSeconds,
    selectedTaskId,
  ]);

  useEffect(() => {
    if (!pomodoro.isRunning) return;

    const intervalId = window.setInterval(() => {
      setPomodoro((current) => {
        if (!current.isRunning) return current;
        if (current.remainingSeconds <= 1) {
          window.setTimeout(() => {
            void finishCurrentSession();
          }, 0);
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
  }, []);

  const resetTaskForm = () => {
    setTaskForm(emptyTaskForm);
  };

  const closeEditTaskModal = () => {
    setEditingTaskId(null);
    setEditTaskForm(emptyTaskForm);
  };

  const handleTaskSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = taskForm.title.trim();
    if (!title) return;

    await createTaskMutation.mutateAsync({
      categoryId: taskForm.categoryId || null,
      title,
      description: taskForm.description.trim() || null,
      priority: taskForm.priority,
      estimatedMinutes: parseEstimatedMinutes(taskForm.estimatedMinutes),
      orderIndex: 0,
    });
    resetTaskForm();
  };

  const editTask = (task: StudyTask) => {
    if (task.status === "done") return;
    setEditingTaskId(task.id);
    setEditTaskForm({
      categoryId: task.categoryId ?? "",
      title: task.title,
      description: task.description ?? "",
      priority: task.priority,
      estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : "",
    });
  };

  const saveEditedTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingTaskId) return;

    const title = editTaskForm.title.trim();
    if (!title) return;

    await updateTaskMutation.mutateAsync({
      id: editingTaskId,
      categoryId: editTaskForm.categoryId || null,
      title,
      description: editTaskForm.description.trim() || null,
      priority: editTaskForm.priority,
      estimatedMinutes: parseEstimatedMinutes(editTaskForm.estimatedMinutes),
    });
    closeEditTaskModal();
  };

  const deleteTask = async (taskId: string) => {
    await deleteTaskMutation.mutateAsync({ id: taskId });
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
      setPomodoro((current) => ({
        ...current,
        selectedTaskId: null,
        isRunning: false,
      }));
    }
  };

  const requestDeleteTask = (task: StudyTask) => {
    setDeleteConfirmation({
      title: task.status === "done" ? "Delete completed task?" : "Delete task?",
      message: `"${task.title}" will be removed from this study plan.`,
      confirmLabel: "Delete Task",
      onConfirm: () => {
        void deleteTask(task.id);
      },
    });
  };

  const deleteIdea = async (ideaId: string) => {
    await deleteIdeaMutation.mutateAsync({ id: ideaId });
    if (editingIdeaId === ideaId) {
      setEditingIdeaId(null);
      setIdeaForm(emptyIdeaForm);
    }
  };

  const requestDeleteIdea = (idea: IdeaVaultItem) => {
    setDeleteConfirmation({
      title: "Delete idea?",
      message: `"${idea.title}" will be removed from your Idea Vault.`,
      confirmLabel: "Delete Idea",
      onConfirm: () => {
        void deleteIdea(idea.id);
      },
    });
  };

  const createCategory = async (input: { name: string; color: string }) => {
    const name = input.name.trim();
    if (!name) return;

    await createCategoryMutation.mutateAsync({
      name,
      color: input.color.trim() || null,
      orderIndex: categories.length,
    });
  };

  const updateCategory = async (id: string, input: { name: string; color: string }) => {
    const name = input.name.trim();
    if (!name) return;

    await updateCategoryMutation.mutateAsync({
      id,
      name,
      color: input.color.trim() || null,
    });
  };

  const deleteCategory = async (categoryId: string) => {
    await deleteCategoryMutation.mutateAsync({ id: categoryId });
  };

  const requestDeleteCategory = (category: StudyCategory) => {
    setDeleteConfirmation({
      title: "Delete category?",
      message: `"${category.name}" will be removed. Tasks in this category will become uncategorized.`,
      confirmLabel: "Delete Category",
      onConfirm: () => {
        void deleteCategory(category.id);
      },
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    deleteConfirmation.onConfirm();
    setDeleteConfirmation(null);
  };

  const markTaskDone = async (taskId: string) => {
    await markDoneMutation.mutateAsync({ id: taskId });
    setPomodoro((current) =>
      current.selectedTaskId === taskId
        ? {
            ...current,
            isRunning: false,
          }
        : current,
    );
  };

  const restoreTask = async (taskId: string) => {
    await restoreTaskMutation.mutateAsync({ id: taskId });
  };

  const startTimer = () => {
    if (!selectedTask) return;
    selectTask(selectedTask.id);

    if (!selectedTask.startedAt) {
      setStartedMutation.mutate({ id: selectedTask.id });
    }

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

  const submitIdea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = ideaForm.title.trim();
    if (!title) return;

    if (editingIdeaId) {
      await updateIdeaMutation.mutateAsync({
        id: editingIdeaId,
        title,
        content: ideaForm.content.trim() || null,
        tag: ideaForm.tag.trim() || null,
      });
      setEditingIdeaId(null);
    } else {
      await createIdeaMutation.mutateAsync({
        title,
        content: ideaForm.content.trim() || null,
        tag: ideaForm.tag.trim() || null,
      });
    }

    setIdeaForm(emptyIdeaForm);
  };

  const editIdea = (idea: IdeaVaultItem) => {
    setEditingIdeaId(idea.id);
    setIdeaForm({
      title: idea.title,
      content: idea.content ?? "",
      tag: idea.tag ?? "",
    });
  };

  const cancelEditIdea = () => {
    setEditingIdeaId(null);
    setIdeaForm(emptyIdeaForm);
  };

  const convertIdeaToTask = async (idea: IdeaVaultItem) => {
    if (idea.convertedTaskId) return;
    await convertIdeaMutation.mutateAsync({ id: idea.id });
  };

  const commonTaskListProps = {
    selectedTaskId,
    onSelectTask: selectTask,
    onEditTask: editTask,
    onDeleteTask: requestDeleteTask,
    onMarkDone: (taskId: string) => {
      void markTaskDone(taskId);
    },
    onRestoreTask: (taskId: string) => {
      void restoreTask(taskId);
    },
    categories,
  };

  const renderDataState = () => {
    if (hasAuthError) {
      return (
        <PlaceholderCard
          icon={Sparkles}
          title="Sign in required"
          body="Study Mode data is now synced to your account. Sign in to view and update tasks, focus sessions, and ideas."
        />
      );
    }

    if (isLoadingData) {
      return (
        <PlaceholderCard
          icon={Sparkles}
          title="Loading Study Mode"
          body="Fetching your tasks, categories, and ideas."
        />
      );
    }

    return null;
  };

  const renderContent = () => {
    const dataState = renderDataState();
    if (dataState && (view === "today" || view === "upcoming" || view === "completed")) {
      return dataState;
    }

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
            categories={categories}
            onManageCategories={() => setIsCategoryModalOpen(true)}
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
          selectedTask={selectedTask?.status === "done" ? null : selectedTask}
          pomodoro={pomodoro}
          timerProgress={timerProgress}
          longBreakDue={longBreakDue}
          onSwitchMode={switchMode}
          onStart={startTimer}
          onPause={pauseTimer}
          onReset={resetTimer}
          onFinish={() => {
            void finishCurrentSession();
          }}
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
        editingIdeaId={editingIdeaId}
        onOpen={() => setIsIdeaVaultOpen(true)}
        onClose={() => setIsIdeaVaultOpen(false)}
        onSubmit={submitIdea}
        onCancelEdit={cancelEditIdea}
        onEditIdea={editIdea}
        onRequestDeleteIdea={requestDeleteIdea}
        onConvertIdea={convertIdeaToTask}
      />
      <EditTaskModal
        isOpen={Boolean(editingTaskId)}
        editTaskForm={editTaskForm}
        setEditTaskForm={setEditTaskForm}
        categories={categories}
        onManageCategories={() => setIsCategoryModalOpen(true)}
        onClose={closeEditTaskModal}
        onSubmit={saveEditedTask}
      />
      <CategoryManagementModal
        isOpen={isCategoryModalOpen}
        categories={categories}
        onClose={() => setIsCategoryModalOpen(false)}
        onCreateCategory={createCategory}
        onUpdateCategory={updateCategory}
        onRequestDeleteCategory={requestDeleteCategory}
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
