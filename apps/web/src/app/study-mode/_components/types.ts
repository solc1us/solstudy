export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "active" | "done";
export type PomodoroMode = "focus" | "short-break" | "long-break";
export type StudyRoute = "today" | "upcoming" | "completed" | "ai-chat" | "mind-map" | "review-cards";

export interface StudyCategory {
  id: string;
  name: string;
  color?: string | null;
  orderIndex: number;
}

export interface StudyTask {
  id: string;
  categoryId?: string | null;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  estimatedMinutes?: number | null;
  focusedMinutes: number;
  restMinutes: number;
  status: TaskStatus;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PomodoroState {
  mode: PomodoroMode;
  plannedSeconds: number;
  startedAt: number | null;
  targetEndAt: number | null;
  pausedRemainingSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  selectedTaskId: string | null;
  completedFocusSessions: number;
}

export interface AlarmSettings {
  enabled: boolean;
  volume: number;
}

export interface IdeaVaultItem {
  id: string;
  title: string;
  content?: string | null;
  tag?: string | null;
  convertedTaskId?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface ProductivityStats {
  totalTasksToday: number;
  completedTasks: number;
  totalFocusSessions: number;
}

export type TaskFormState = {
  categoryId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  estimatedMinutes: string;
};

export type IdeaFormState = {
  title: string;
  content: string;
  tag: string;
};

export type DeleteConfirmationState = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
} | null;
