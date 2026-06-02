"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { StudyCategory } from "./types";

type CategoryFormState = {
  name: string;
  color: string;
};

const emptyCategoryForm: CategoryFormState = {
  name: "",
  color: "",
};

export function CategoryManagementModal({
  isOpen,
  categories,
  onClose,
  onCreateCategory,
  onUpdateCategory,
  onRequestDeleteCategory,
}: {
  isOpen: boolean;
  categories: StudyCategory[];
  onClose: () => void;
  onCreateCategory: (input: CategoryFormState) => Promise<void>;
  onUpdateCategory: (id: string, input: CategoryFormState) => Promise<void>;
  onRequestDeleteCategory: (category: StudyCategory) => void;
}) {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);

  useEffect(() => {
    if (!isOpen) {
      setEditingCategoryId(null);
      setCategoryForm(emptyCategoryForm);
    }
  }, [isOpen]);

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = categoryForm.name.trim();
    if (!name) return;

    if (editingCategoryId) {
      await onUpdateCategory(editingCategoryId, categoryForm);
    } else {
      await onCreateCategory(categoryForm);
    }

    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  };

  const startEdit = (category: StudyCategory) => {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      color: category.color ?? "",
    });
  };

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
          <motion.div
            initial={{ y: 18, scale: 0.97, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 18, scale: 0.97, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#232f48] bg-[#1a2332] shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-[#232f48] p-5">
              <div>
                <h2 className="text-xl font-semibold text-white">Manage Categories</h2>
                <p className="mt-1 text-sm text-[#92a4c9]">
                  Organize tasks without changing the Study Mode layout.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                aria-label="Close category modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-5rem)] overflow-y-auto p-5 [scrollbar-color:#33415f_#111722] [scrollbar-width:thin]">
              <form
                onSubmit={submitCategory}
                className="rounded-2xl border border-[#232f48] bg-[#111722] p-4"
              >
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
                  <input
                    value={categoryForm.name}
                    onChange={(event) =>
                      setCategoryForm((current) => ({ ...current, name: event.target.value }))
                    }
                    placeholder="Category name"
                    className="h-11 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 text-sm text-white outline-none placeholder:text-[#556987] focus:border-blue-500/60"
                  />
                  <input
                    value={categoryForm.color}
                    onChange={(event) =>
                      setCategoryForm((current) => ({ ...current, color: event.target.value }))
                    }
                    placeholder="#3b82f6"
                    className="h-11 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 text-sm text-white outline-none placeholder:text-[#556987] focus:border-blue-500/60"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    <Plus size={16} />
                    {editingCategoryId ? "Save" : "Add"}
                  </button>
                </div>
              </form>

              <div className="mt-5 space-y-3">
                {categories.length ? (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#232f48] bg-[#111722] p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full bg-blue-400"
                          style={{ backgroundColor: category.color ?? undefined }}
                        />
                        <span className="truncate font-semibold text-white">{category.name}</span>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(category)}
                          className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-blue-500/10 hover:text-blue-300"
                          aria-label={`Edit ${category.name}`}
                        >
                          <Edit3 size={17} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDeleteCategory(category)}
                          className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-red-500/10 hover:text-red-300"
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#232f48] p-6 text-center text-sm text-[#92a4c9]">
                    No categories yet.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
