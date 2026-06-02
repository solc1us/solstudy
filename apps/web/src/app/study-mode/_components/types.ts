export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "active" | "done";
export type PomodoroMode = "focus" | "short-break" | "long-break";
export type StudyRoute = "today" | "upcoming" | "completed" | "ai-chat" | "mind-map" | "review-cards";

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

export type TaskFormState = {
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedPomodoros: number;
};

export type IdeaFormState = {
  title: string;
  note: string;
  tag: string;
};

export type DeleteConfirmationState = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
} | null;
