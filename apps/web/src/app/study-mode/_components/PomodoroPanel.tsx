"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Bell,
	BellOff,
	Clock3,
	Pause,
	Play,
	RotateCcw,
	Target,
	TimerReset,
} from "lucide-react";
import { formatTime, getDurationForMode, modeLabel } from "./storage";
import type {
	AlarmSettings,
	PomodoroMode,
	PomodoroState,
	StudyTask,
} from "./types";

const panelTransition = { duration: 0.18, ease: "easeOut" } as const;

export function PomodoroPanel({
	selectedTask,
	pomodoro,
	timerProgress,
	longBreakDue,
	onSwitchMode,
	onStart,
	onPause,
	onReset,
	onFinish,
	alarmSettings,
	onAlarmSettingsChange,
	isCollapsed,
	onCollapsedChange,
	isCompletingSession,
}: {
	selectedTask: StudyTask | null;
	pomodoro: PomodoroState;
	timerProgress: number;
	longBreakDue: boolean;
	onSwitchMode: (mode: PomodoroMode) => void;
	onStart: () => void;
	onPause: () => void;
	onReset: () => void;
	onFinish: () => void;
	alarmSettings: AlarmSettings;
	onAlarmSettingsChange: (settings: AlarmSettings) => void;
	isCollapsed: boolean;
	onCollapsedChange: (isCollapsed: boolean) => void;
	isCompletingSession: boolean;
}) {
	return (
		<aside className="space-y-5">
			<section className="sticky top-0 rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-4 shadow-xl shadow-black/15 backdrop-blur">
				<div className="mb-4 flex items-center justify-between">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
							Pomodoro Panel
						</p>
						<h2 className="mt-1 text-lg font-semibold text-white">
							{modeLabel(pomodoro.mode)}
						</h2>
					</div>
					<button
						type="button"
						onClick={() => onCollapsedChange(!isCollapsed)}
						className="rounded-xl bg-blue-500/10 p-2.5 text-blue-300 shadow-[0_0_18px_rgba(19,91,236,0.18)] transition hover:bg-blue-500/15 hover:text-blue-200"
						aria-label={isCollapsed ? "Expand Pomodoro panel" : "Collapse Pomodoro panel"}
					>
						<Clock3 size={20} />
					</button>
				</div>

				<AnimatePresence mode="wait" initial={false}>
					{selectedTask ? (
						isCollapsed ? (
							<motion.div
								key="pomodoro-collapsed"
								initial={{ opacity: 0, y: -4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								transition={panelTransition}
								className="overflow-hidden rounded-xl border border-[#232f48] bg-[#111722] p-3"
							>
								<div className="flex items-center justify-between gap-3">
									<div className="min-w-0">
										<p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
											{modeLabel(pomodoro.mode)}
										</p>
										<p className="mt-1 truncate text-sm font-semibold text-white">
											{selectedTask.title}
										</p>
									</div>
									<div className="shrink-0 text-right">
										<p className="text-2xl font-semibold tracking-tight text-white">
											{formatTime(pomodoro.remainingSeconds)}
										</p>
										<p className="text-xs uppercase tracking-wider text-[#92a4c9]">
											{pomodoro.isRunning ? "Running" : "Paused"}
										</p>
									</div>
								</div>
							</motion.div>
						) : (
					<motion.div
						key="pomodoro-expanded"
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={panelTransition}
						className="overflow-hidden"
					>
						<div className="mb-4 rounded-xl border border-[#232f48] bg-[#111722] p-3">
							<p className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
								Selected Task
							</p>
							<h3 className="mt-2 text-base font-semibold text-white">
								{selectedTask.title}
							</h3>
							{/* <p className="mt-2 text-sm leading-6 text-[#92a4c9]">
                {selectedTask.description || "No description added."}
              </p> */}
						</div>

						<div className="relative mx-auto mb-4 flex aspect-square max-w-[14rem] items-center justify-center rounded-full border border-[#232f48] bg-[#111722] shadow-inner">
							<div
								className="absolute inset-3 rounded-full"
								style={{
									background: `conic-gradient(#135bec ${Math.max(timerProgress, 0) * 360}deg, #232f48 0deg)`,
								}}
							/>
							<div className="absolute inset-6 rounded-full bg-[#111722]" />
							<div className="relative text-center">
								<p className="text-4xl font-semibold tracking-tight text-white">
									{formatTime(pomodoro.remainingSeconds)}
								</p>
								<p className="mt-2 text-xs uppercase tracking-wider text-[#92a4c9]">
									{pomodoro.isRunning ? "Running" : "Paused"}
								</p>
							</div>
						</div>

						<div className="mb-4 grid grid-cols-3 gap-2">
							{(["focus", "short-break", "long-break"] as const).map((mode) => (
								<button
									type="button"
									key={mode}
									onClick={() => onSwitchMode(mode)}
									className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
										pomodoro.mode === mode
											? "border-blue-500/50 bg-blue-600 text-white"
											: "border-[#232f48] bg-[#111722] text-[#92a4c9] hover:text-white"
									}`}
								>
									{modeLabel(mode)}
								</button>
							))}
						</div>

						{longBreakDue ? (
							<div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">
								Four focus sessions completed. Take the long break before the
								next sprint.
							</div>
						) : null}

						<div className="mb-4 rounded-xl border border-[#232f48] bg-[#111722] p-3">
							<div className="flex items-center justify-between gap-3">
								<button
									type="button"
									onClick={() =>
										onAlarmSettingsChange({
											...alarmSettings,
											enabled: !alarmSettings.enabled,
										})
									}
									className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
										alarmSettings.enabled
											? "border-blue-400/30 bg-blue-500/10 text-blue-100"
											: "border-[#232f48] bg-[#1a2332] text-[#92a4c9] hover:text-white"
									}`}
								>
									{alarmSettings.enabled ? (
										<Bell size={15} />
									) : (
										<BellOff size={15} />
									)}
									Alarm
								</button>
								<div className="flex min-w-0 flex-1 items-center gap-2">
									<span className="text-xs font-semibold text-[#556987]">
										Volume
									</span>
									<input
										type="range"
										min={0}
										max={1}
										step={0.05}
										value={alarmSettings.volume}
										onChange={(event) =>
											onAlarmSettingsChange({
												...alarmSettings,
												volume: Number(event.target.value),
											})
										}
										className="min-w-0 flex-1 accent-blue-500"
										aria-label="Alarm volume"
									/>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-2">
							{pomodoro.isRunning ? (
								<button
									type="button"
									onClick={onPause}
									className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#232f48] bg-[#111722] px-3 py-3 text-sm font-semibold text-[#c5d3ef] transition hover:text-white"
								>
									<Pause size={16} />
									Pause
								</button>
							) : (
								<button
									type="button"
									onClick={onStart}
									className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(19,91,236,0.35)] transition hover:bg-blue-500"
								>
									<Play size={16} />
									{pomodoro.remainingSeconds ===
									getDurationForMode(pomodoro.mode)
										? "Start"
										: "Resume"}
								</button>
							)}
							<button
								type="button"
								onClick={onReset}
								className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#232f48] bg-[#111722] px-3 py-3 text-sm font-semibold text-[#c5d3ef] transition hover:text-white"
							>
								<RotateCcw size={16} />
								Reset
							</button>
							<button
								type="button"
								onClick={onFinish}
								disabled={isCompletingSession}
								className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/15 disabled:cursor-wait disabled:opacity-70"
							>
								{isCompletingSession ? (
									<span className="h-4 w-4 rounded-full border-2 border-emerald-200/35 border-t-emerald-100 animate-spin" />
								) : (
									<TimerReset size={16} />
								)}
								{isCompletingSession ? "Completing..." : "Finish Session"}
							</button>
						</div>
					</motion.div>
						)
				) : (
					<motion.div
						key="pomodoro-empty"
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={panelTransition}
						className="overflow-hidden rounded-2xl border border-dashed border-[#232f48] bg-[#111722] p-8 text-center"
					>
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
							<Target size={26} />
						</div>
						<h3 className="text-lg font-semibold text-white">
							Select a task to start focusing.
						</h3>
						<p className="mt-2 text-sm leading-6 text-[#92a4c9]">
							Add a task or choose one from the active list, then start the
							timer.
						</p>
					</motion.div>
				)}
				</AnimatePresence>
			</section>
		</aside>
	);
}
