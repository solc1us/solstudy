"use client";

import { Plus } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { TaskFormState, TaskPriority } from "./types";

export function CreateTaskForm({
  taskForm,
  setTaskForm,
  onSubmit,
}: {
  taskForm: TaskFormState;
  setTaskForm: Dispatch<SetStateAction<TaskFormState>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-3 shadow-xl shadow-black/10 backdrop-blur sm:p-4"
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold text-white">Create Task</h2>
        <p className="text-sm text-[#92a4c9]">Define a clear output before starting the timer.</p>
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
            className="h-10 w-full rounded-xl border border-[#232f48] bg-[#111722] px-3 text-sm text-white outline-none transition placeholder:text-[#556987] focus:border-blue-500/60"
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
            className="h-10 w-full rounded-xl border border-[#232f48] bg-[#111722] px-3 text-sm text-white outline-none transition focus:border-blue-500/60"
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
            className="h-10 w-full rounded-xl border border-[#232f48] bg-[#111722] px-3 text-sm text-white outline-none transition focus:border-blue-500/60"
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
          rows={2}
          className="w-full resize-none rounded-xl border border-[#232f48] bg-[#111722] px-3 py-2.5 text-sm leading-6 text-white outline-none transition placeholder:text-[#556987] focus:border-blue-500/60"
        />
        <button
          type="submit"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(19,91,236,0.28)] transition hover:bg-blue-500"
        >
          <Plus size={17} />
          Add Task
        </button>
      </div>
    </form>
  );
}
