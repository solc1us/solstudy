"use client";

import { Plus } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CustomSelect } from "./CustomSelect";
import type { StudyCategory, TaskFormState, TaskPriority } from "./types";

const estimatePresets = [15, 25, 45, 60, 90];

export function CreateTaskForm({
  taskForm,
  setTaskForm,
  categories,
  onManageCategories,
  onSubmit,
}: {
  taskForm: TaskFormState;
  setTaskForm: Dispatch<SetStateAction<TaskFormState>>;
  categories: StudyCategory[];
  onManageCategories: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];
  const categoryOptions = [
    { value: "", label: "None" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
      color: category.color,
    })),
  ];

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-3 shadow-xl shadow-black/10 backdrop-blur sm:p-4"
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold text-white">Create Task</h2>
        <p className="text-sm text-[#92a4c9]">Define a clear output before starting the timer.</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_8rem]">
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
          <CustomSelect
            value={taskForm.priority}
            options={priorityOptions}
            onChange={(value) =>
              setTaskForm((current) => ({
                ...current,
                priority: value as TaskPriority,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
              Category
            </label>
            <button
              type="button"
              onClick={onManageCategories}
              className="text-xs font-semibold text-blue-300 transition hover:text-blue-200"
            >
              Manage
            </button>
          </div>
          <CustomSelect
            value={taskForm.categoryId}
            options={categoryOptions}
            onChange={(value) =>
              setTaskForm((current) => ({
                ...current,
                categoryId: value,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="task-estimate-input" className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
            Minutes
          </label>
          <input
            id="task-estimate-input"
            type="number"
            min={0}
            value={taskForm.estimatedMinutes}
            onChange={(event) =>
              setTaskForm((current) => ({
                ...current,
                estimatedMinutes: event.target.value,
              }))
            }
            className="h-10 w-full rounded-xl border border-[#232f48] bg-[#111722] px-3 text-sm text-white outline-none transition focus:border-blue-500/60"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {estimatePresets.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() =>
              setTaskForm((current) => ({ ...current, estimatedMinutes: String(minutes) }))
            }
            className="rounded-lg border border-[#232f48] bg-[#111722] px-2.5 py-1.5 text-xs font-semibold text-[#92a4c9] transition hover:text-white"
          >
            {minutes}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTaskForm((current) => ({ ...current, estimatedMinutes: "" }))}
          className="rounded-lg border border-[#232f48] bg-[#111722] px-2.5 py-1.5 text-xs font-semibold text-[#92a4c9] transition hover:text-white"
        >
          Custom
        </button>
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
