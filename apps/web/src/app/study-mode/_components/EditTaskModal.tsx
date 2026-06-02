"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { CustomSelect } from "./CustomSelect";
import type { StudyCategory, TaskFormState, TaskPriority } from "./types";

const estimatePresets = [15, 25, 45, 60, 90];

export function EditTaskModal({
  isOpen,
  editTaskForm,
  setEditTaskForm,
  categories,
  onManageCategories,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  editTaskForm: TaskFormState;
  setEditTaskForm: Dispatch<SetStateAction<TaskFormState>>;
  categories: StudyCategory[];
  onManageCategories: () => void;
  onClose: () => void;
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
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            onSubmit={onSubmit}
            initial={{ y: 18, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.97, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl rounded-2xl border border-[#232f48] bg-[#1a2332] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Edit Task</h2>
                <p className="mt-1 text-sm text-[#92a4c9]">
                  Update this active task without changing the create form.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                aria-label="Close edit task modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="edit-task-title-input" className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
                  Task title
                </label>
                <input
                  id="edit-task-title-input"
                  value={editTaskForm.title}
                  onChange={(event) =>
                    setEditTaskForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="h-10 w-full rounded-xl border border-[#232f48] bg-[#111722] px-3 text-sm text-white outline-none transition placeholder:text-[#556987] focus:border-blue-500/60"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-task-description-input" className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
                  Description
                </label>
                <textarea
                  id="edit-task-description-input"
                  value={editTaskForm.description}
                  onChange={(event) =>
                    setEditTaskForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#232f48] bg-[#111722] px-3 py-2.5 text-sm leading-6 text-white outline-none transition placeholder:text-[#556987] focus:border-blue-500/60"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="edit-task-priority-input" className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
                    Priority
                  </label>
                  <CustomSelect
                    value={editTaskForm.priority}
                    options={priorityOptions}
                    onChange={(value) =>
                      setEditTaskForm((current) => ({
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
                    value={editTaskForm.categoryId}
                    options={categoryOptions}
                    onChange={(value) =>
                      setEditTaskForm((current) => ({
                        ...current,
                        categoryId: value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-task-estimate-input" className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
                    Minutes
                  </label>
                  <input
                    id="edit-task-estimate-input"
                    type="number"
                    min={0}
                    value={editTaskForm.estimatedMinutes}
                    onChange={(event) =>
                      setEditTaskForm((current) => ({
                        ...current,
                        estimatedMinutes: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-xl border border-[#232f48] bg-[#111722] px-3 text-sm text-white outline-none transition focus:border-blue-500/60"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {estimatePresets.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() =>
                      setEditTaskForm((current) => ({
                        ...current,
                        estimatedMinutes: String(minutes),
                      }))
                    }
                    className="rounded-lg border border-[#232f48] bg-[#111722] px-2.5 py-1.5 text-xs font-semibold text-[#92a4c9] transition hover:text-white"
                  >
                    {minutes}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setEditTaskForm((current) => ({ ...current, estimatedMinutes: "" }))}
                  className="rounded-lg border border-[#232f48] bg-[#111722] px-2.5 py-1.5 text-xs font-semibold text-[#92a4c9] transition hover:text-white"
                >
                  Custom
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#232f48] px-4 py-2.5 text-sm font-semibold text-[#92a4c9] transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_rgba(19,91,236,0.28)] transition hover:bg-blue-500"
              >
                Save Changes
              </button>
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
