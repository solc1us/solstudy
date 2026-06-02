"use client";

import { Check, Edit3, Lightbulb, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { IdeaFormState, IdeaVaultItem } from "./types";

export function IdeaVaultModal({
  isOpen,
  ideas,
  ideaForm,
  setIdeaForm,
  editingIdeaId,
  onOpen,
  onClose,
  onSubmit,
  onCancelEdit,
  onEditIdea,
  onRequestDeleteIdea,
  onConvertIdea,
}: {
  isOpen: boolean;
  ideas: IdeaVaultItem[];
  ideaForm: IdeaFormState;
  setIdeaForm: Dispatch<SetStateAction<IdeaFormState>>;
  editingIdeaId: string | null;
  onOpen: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
  onEditIdea: (idea: IdeaVaultItem) => void;
  onRequestDeleteIdea: (idea: IdeaVaultItem) => void;
  onConvertIdea: (idea: IdeaVaultItem) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/30 bg-[#1a2332] text-blue-200 shadow-[0_0_24px_rgba(19,91,236,0.34)] transition hover:bg-blue-600 hover:text-white"
        aria-label="Open Idea Vault"
      >
        <Lightbulb size={21} />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 20, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 20, scale: 0.96, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[#232f48] bg-[#1a2332] shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-[#232f48] p-5">
                <div>
                  <h2 className="text-xl font-semibold text-white">Idea Vault</h2>
                  <p className="mt-1 text-sm text-[#92a4c9]">
                    Save quick thoughts without breaking your focus.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                  aria-label="Close Idea Vault"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[calc(90vh-5rem)] overflow-y-auto p-5 [scrollbar-color:#33415f_#111722] [scrollbar-width:thin]">
                <form onSubmit={onSubmit} className="rounded-2xl border border-[#232f48] bg-[#111722] p-4">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
                    <input
                      value={ideaForm.title}
                      onChange={(event) =>
                        setIdeaForm((current) => ({ ...current, title: event.target.value }))
                      }
                      placeholder="Idea title"
                      className="h-11 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 text-sm text-white outline-none placeholder:text-[#556987] focus:border-blue-500/60"
                    />
                    <input
                      value={ideaForm.tag}
                      onChange={(event) =>
                        setIdeaForm((current) => ({ ...current, tag: event.target.value }))
                      }
                      placeholder="Optional tag"
                      className="h-11 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 text-sm text-white outline-none placeholder:text-[#556987] focus:border-blue-500/60"
                    />
                  </div>
                  <textarea
                    value={ideaForm.content}
                    onChange={(event) =>
                      setIdeaForm((current) => ({ ...current, content: event.target.value }))
                    }
                    placeholder="Write the thought quickly..."
                    rows={3}
                    className="mt-3 w-full resize-none rounded-xl border border-[#232f48] bg-[#1a2332] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-[#556987] focus:border-blue-500/60"
                  />
                  <button
                    type="submit"
                    className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                  >
                    <Plus size={16} />
                    {editingIdeaId ? "Save Idea" : "Add Idea"}
                  </button>
                  {editingIdeaId ? (
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="ml-2 mt-3 inline-flex items-center justify-center rounded-xl border border-[#232f48] px-4 py-2.5 text-sm font-semibold text-[#92a4c9] transition hover:text-white"
                    >
                      Cancel
                    </button>
                  ) : null}
                </form>

                <div className="mt-5 space-y-3">
                  {ideas.length ? (
                    ideas.map((idea) => (
                      <div key={idea.id} className="rounded-2xl border border-[#232f48] bg-[#111722] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-white">{idea.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-[#92a4c9]">
                              {idea.content || "No content added."}
                            </p>
                            {idea.tag ? (
                              <span className="mt-3 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-200">
                                {idea.tag}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => onConvertIdea(idea)}
                              disabled={Boolean(idea.convertedTaskId)}
                              className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-emerald-500/10 hover:text-emerald-300 disabled:cursor-default disabled:opacity-40"
                              aria-label={`Convert ${idea.title} to task`}
                            >
                              <Check size={17} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onEditIdea(idea)}
                              className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-blue-500/10 hover:text-blue-300"
                              aria-label={`Edit ${idea.title}`}
                            >
                              <Edit3 size={17} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRequestDeleteIdea(idea)}
                              className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-red-500/10 hover:text-red-300"
                              aria-label={`Delete ${idea.title}`}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[#232f48] p-6 text-center text-sm text-[#92a4c9]">
                      No ideas saved yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
