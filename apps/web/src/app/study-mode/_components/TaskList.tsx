"use client";

import type { ReactNode } from "react";
import { TaskCard } from "./TaskCard";
import type { TaskActionLoadingState } from "./TaskCard";
import type { StudyCategory, StudyTask } from "./types";

export function TaskList({
  title,
  subtitle,
  tasks,
  categories,
  selectedTaskId,
  onSelectTask,
  onEditTask,
  onDeleteTask,
  onMarkDone,
  onRestoreTask,
  emptyText = "No active tasks yet.",
  headerAction,
  isUpdating,
  loadingAction,
}: {
  title: string;
  subtitle: string;
  tasks: StudyTask[];
  categories: StudyCategory[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onEditTask: (task: StudyTask) => void;
  onDeleteTask: (task: StudyTask) => void;
  onMarkDone: (taskId: string) => void;
  onRestoreTask: (taskId: string) => void;
  emptyText?: string;
  headerAction?: ReactNode;
  isUpdating: boolean;
  loadingAction: TaskActionLoadingState;
}) {
  return (
    <section className="rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-4 shadow-2xl shadow-black/15 backdrop-blur sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {isUpdating ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-200">
                <span className="h-2 w-2 rounded-full border border-blue-200/40 border-t-blue-100 animate-spin" />
                Updating...
              </span>
            ) : null}
          </div>
          <p className="text-sm text-[#92a4c9]">{subtitle}</p>
        </div>
        {headerAction ? <div className="shrink-0 sm:w-44">{headerAction}</div> : null}
      </div>
      <div className={`space-y-3 transition-opacity ${isUpdating ? "opacity-80" : "opacity-100"}`}>
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              category={categories.find((category) => category.id === task.categoryId)}
              isSelected={task.id === selectedTaskId}
              onSelect={() => onSelectTask(task.id)}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task)}
              onMarkDone={() => onMarkDone(task.id)}
              onRestore={() => onRestoreTask(task.id)}
              loadingAction={loadingAction}
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
