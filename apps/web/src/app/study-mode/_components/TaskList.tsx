"use client";

import type { ReactNode } from "react";
import { TaskCard } from "./TaskCard";
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
}) {
  return (
    <section className="rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-4 shadow-2xl shadow-black/15 backdrop-blur sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="text-sm text-[#92a4c9]">{subtitle}</p>
        </div>
        {headerAction ? <div className="shrink-0 sm:w-44">{headerAction}</div> : null}
      </div>
      <div className="space-y-3">
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
