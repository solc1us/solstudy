"use client";

import { CheckCircle2, Clock3, Edit3, Play, RotateCcw, Trash2 } from "lucide-react";
import { priorityStyles, statusStyles } from "./storage";
import type { StudyTask } from "./types";

export function TaskCard({
  task,
  category,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onMarkDone,
  onRestore,
}: {
  task: StudyTask;
  category?: { name: string; color?: string | null };
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkDone: () => void;
  onRestore: () => void;
}) {
  const totalSpentMinutes = task.focusedMinutes + task.restMinutes;
  const estimatedMinutes = task.estimatedMinutes ?? null;
  const progress = Math.min(
    100,
    estimatedMinutes ? Math.round((task.focusedMinutes / Math.max(estimatedMinutes, 1)) * 100) : 0,
  );
  const displayStatus = isSelected && task.status !== "done" ? "active" : task.status;
  const indicatorClass =
    task.status === "done"
      ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)]"
      : isSelected
        ? "bg-gradient-to-br from-blue-300 to-emerald-300 shadow-[0_0_14px_rgba(19,91,236,0.5)]"
        : "border border-[#33415f] bg-[#1a2332]";

  return (
    <article
      className={`rounded-xl border p-3 transition ${
        isSelected
          ? "border-blue-400/40 bg-[#111722] shadow-[0_0_16px_rgba(19,91,236,0.16)]"
          : "border-[#232f48] bg-[#111722]/80 hover:border-blue-500/25"
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <button
          type="button"
          onClick={task.status === "done" ? undefined : onSelect}
          disabled={task.status === "done"}
          className="min-w-0 flex-1 text-left disabled:cursor-default"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${indicatorClass}`} />
            <h3 className="font-semibold text-white">{task.title}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityStyles(task.priority)}`}>
              {task.priority}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyles(displayStatus)}`}>
              {displayStatus}
            </span>
            {category ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#33415f] bg-[#1a2332] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c5d3ef]">
                <span
                  className="h-2 w-2 rounded-full bg-blue-400"
                  style={{ backgroundColor: category.color ?? undefined }}
                />
                {category.name}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-[#92a4c9]">
            {task.description || "No description added."}
          </p>
        </button>

        <div className="flex shrink-0 flex-wrap gap-2">
          {task.status !== "done" ? (
            <button
              type="button"
              onClick={onSelect}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/15"
            >
              <Play size={14} />
              Set Active
            </button>
          ) : null}
          {task.status !== "done" ? (
            <button
              type="button"
              onClick={onEdit}
              className="rounded-xl border border-[#232f48] p-2 text-[#92a4c9] transition hover:text-white"
              aria-label={`Edit ${task.title}`}
            >
              <Edit3 size={15} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-[#232f48] p-2 text-[#92a4c9] transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 size={15} />
          </button>
          {task.status !== "done" ? (
            <button
              type="button"
              onClick={onMarkDone}
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-2 text-emerald-200 transition hover:bg-emerald-400/15"
              aria-label={`Mark ${task.title} done`}
            >
              <CheckCircle2 size={15} />
            </button>
          ) : null}
          {task.status === "done" ? (
            <button
              type="button"
              onClick={onRestore}
              className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-2 text-blue-200 transition hover:bg-blue-400/15"
              aria-label={`Restore ${task.title}`}
            >
              <RotateCcw size={15} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-[#92a4c9]">
            <span>Progress</span>
            <span>
              {task.focusedMinutes}
              {estimatedMinutes ? `/${estimatedMinutes}` : ""} focus min
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#1a2332]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[#232f48] bg-[#1a2332] px-3 py-2 text-xs font-semibold text-[#c5d3ef]">
          <Clock3 size={14} className="text-blue-300" />
          {estimatedMinutes ? `Est. ${estimatedMinutes}m` : "No estimate"} · {totalSpentMinutes}m
          spent
        </div>
      </div>
    </article>
  );
}
