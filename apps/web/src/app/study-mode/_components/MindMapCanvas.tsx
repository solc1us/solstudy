"use client";

import { GitBranch, Network, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import type { StudyTask } from "./StudyModeView";

type MindMapCanvasProps = {
  topic: string;
  tasks: StudyTask[];
  generated: boolean;
  onGenerate: () => void;
};

const fallbackNodes = [
  { label: "Understand", x: "16%", y: "22%", accent: "border-blue-400/50 text-blue-200" },
  { label: "Practice", x: "68%", y: "24%", accent: "border-emerald-400/50 text-emerald-200" },
  { label: "Recall", x: "20%", y: "66%", accent: "border-cyan-400/50 text-cyan-200" },
  { label: "Review", x: "66%", y: "68%", accent: "border-violet-400/50 text-violet-200" },
];

export default function MindMapCanvas({
  topic,
  tasks,
  generated,
  onGenerate,
}: MindMapCanvasProps) {
  const centerLabel = topic.trim() || "Study Topic";
  const visibleTasks = generated ? tasks : [];
  const nodes = visibleTasks.length
    ? visibleTasks.map((task, index) => ({
        label: task.title,
        x: `${index % 2 === 0 ? 13 : 63}%`,
        y: `${20 + Math.floor(index / 2) * 22}%`,
        accent:
          task.status === "done"
            ? "border-emerald-400/50 text-emerald-200"
            : task.status === "active"
              ? "border-blue-400/50 text-blue-200"
              : "border-[#3a4b6f] text-[#c5d3ef]",
      }))
    : fallbackNodes;

  return (
    <section className="relative h-full overflow-hidden bg-[#111722]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(35,47,72,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(35,47,72,0.45)_1px,transparent_1px)] bg-[size:42px_42px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(19,91,236,0.16),transparent_34rem)]" />

      <div className="relative z-10 flex h-full flex-col p-4 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#232f48] bg-[#1a2332]/80 p-4 shadow-2xl shadow-black/20 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
              <Network size={15} />
              Mind Map Canvas
            </div>
            <h2 className="mt-1 text-xl font-semibold text-white">{centerLabel}</h2>
          </div>
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(19,91,236,0.35)] transition hover:bg-blue-500"
          >
            <Sparkles size={16} />
            Generate Mock Map
          </button>
        </div>

        <div className="relative min-h-[34rem] flex-1 overflow-hidden rounded-2xl border border-[#232f48] bg-[#0f1520]/80 shadow-inner">
          <svg className="absolute inset-0 h-full w-full" role="presentation">
            <defs>
              <linearGradient id="mapLine" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#135bec" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0.75" />
              </linearGradient>
            </defs>
            {nodes.map((node) => (
              <line
                key={node.label}
                x1="50%"
                y1="48%"
                x2={node.x}
                y2={node.y}
                stroke="url(#mapLine)"
                strokeWidth="2"
                strokeDasharray="8 8"
              />
            ))}
          </svg>

          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute left-1/2 top-[48%] z-10 w-52 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-blue-400/50 bg-[#1a2332] p-5 text-center shadow-[0_0_42px_rgba(19,91,236,0.36)]"
          >
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
              <GitBranch size={22} />
            </div>
            <div className="text-sm font-semibold text-white">{centerLabel}</div>
            <p className="mt-2 text-xs leading-5 text-[#92a4c9]">
              {generated
                ? "Generated from your current tasks."
                : "Generate a mock map from your topic or recent chat."}
            </p>
          </motion.div>

          {nodes.map((node, index) => (
            <motion.div
              key={`${node.label}-${index}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className={`absolute z-10 max-w-[12rem] rounded-xl border bg-[#1a2332]/95 px-4 py-3 shadow-xl shadow-black/20 ${node.accent}`}
              style={{ left: node.x, top: node.y }}
            >
              <div className="text-sm font-semibold">{node.label}</div>
              <div className="mt-1 text-xs text-[#92a4c9]">
                {visibleTasks[index]?.status ?? "concept"}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
