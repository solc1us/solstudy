"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@solstudy/ui/components/dropdown-menu";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Edit3,
  LoaderCircle,
  MoreHorizontal,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { priorityStyles, statusStyles } from "./storage";
import type { StudyTask } from "./types";

export type TaskActionLoadingState = {
  taskId: string;
  action: "delete" | "done" | "restore";
} | null;

export function TaskCard({
  task,
  category,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onMarkDone,
  onRestore,
  loadingAction,
}: {
  task: StudyTask;
  category?: { name: string; color?: string | null };
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkDone: () => void;
  onRestore: () => void;
  loadingAction: TaskActionLoadingState;
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
  const activeLoadingAction =
    loadingAction?.taskId === task.id ? loadingAction.action : null;
  const isActionLoading = Boolean(activeLoadingAction);

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

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                disabled={isActionLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#232f48] bg-[#1a2332] text-[#92a4c9] transition hover:border-blue-500/30 hover:text-white"
                aria-label={`Open actions for ${task.title}`}
              />
            }
          >
            <MoreHorizontal size={17} />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            positionerClassName="z-[80]"
            className="w-44 rounded-xl border border-[#232f48] bg-[#111722] p-1 text-[#c5d3ef] shadow-xl duration-150"
          >
            <motion.div
              initial={{ opacity: 0, y: -3, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
            {task.status !== "done" ? (
              <>
                <DropdownMenuItem
                  onClick={onEdit}
                  disabled={isActionLoading}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm focus:bg-[#1a2332] focus:text-white"
                >
                  <Edit3 size={15} />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  disabled={isActionLoading}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-red-300 focus:bg-red-500/10 focus:text-red-200"
                >
                  {activeLoadingAction === "delete" ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                  {activeLoadingAction === "delete" ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onMarkDone}
                  disabled={isActionLoading}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-emerald-200 focus:bg-emerald-400/10 focus:text-emerald-100"
                >
                  {activeLoadingAction === "done" ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  {activeLoadingAction === "done" ? "Updating..." : "Mark Done"}
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={onDelete}
                  disabled={isActionLoading}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-red-300 focus:bg-red-500/10 focus:text-red-200"
                >
                  {activeLoadingAction === "delete" ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                  {activeLoadingAction === "delete" ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onRestore}
                  disabled={isActionLoading}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm text-blue-200 focus:bg-blue-500/10 focus:text-blue-100"
                >
                  {activeLoadingAction === "restore" ? (
                    <LoaderCircle size={15} className="animate-spin" />
                  ) : (
                    <RotateCcw size={15} />
                  )}
                  {activeLoadingAction === "restore" ? "Restoring..." : "Restore"}
                </DropdownMenuItem>
              </>
            )}
            </motion.div>
          </DropdownMenuContent>
        </DropdownMenu>
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
          {estimatedMinutes ? `Est. ${estimatedMinutes}m` : "No estimate"} - {totalSpentMinutes}m spent
        </div>
      </div>
    </article>
  );
}
