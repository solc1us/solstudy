"use client";

import { TaskCard } from "./TaskCard";
import type { StudyTask } from "./types";

export function TaskList({
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
  onDeleteTask: (task: StudyTask) => void;
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
              onDelete={() => onDeleteTask(task)}
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
