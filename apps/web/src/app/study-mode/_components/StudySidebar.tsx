"use client";

import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Flame,
  ListChecks,
  LogOut,
  Sparkles,
  Target,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";
import type { ProductivityStats } from "./types";

const primaryItems = [
  { label: "Today", href: "/study-mode/today", icon: Target },
  { label: "Upcoming", href: "/study-mode/upcoming", icon: CalendarClock },
  { label: "Completed", href: "/study-mode/completed", icon: CheckCircle2 },
] as const;

const secondaryItems = [
  { label: "AI Chat", href: "/study-mode/ai-chat", icon: Sparkles },
  { label: "Mind Map", href: "/study-mode/mind-map", icon: BarChart3 },
  { label: "Review Cards", href: "/study-mode/review-cards", icon: ListChecks },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/study-mode/today") {
    return pathname === "/study-mode" || pathname === "/study-mode/today";
  }
  return pathname === href;
}

export function StudySidebar({
  isOpen,
  onClose,
  stats,
  longBreakDue,
}: {
  isOpen: boolean;
  onClose: () => void;
  stats: ProductivityStats;
  longBreakDue: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const userLabel = session?.user.name || session?.user.email || "Account";
  const userSubLabel =
    session?.user.name && session.user.email ? session.user.email : "Signed in";

  return (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <motion.aside
          key="productivity-sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 292, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="hidden h-full shrink-0 overflow-hidden border-r border-[#232f48] bg-[#111722]/95 shadow-2xl shadow-black/20 backdrop-blur md:flex md:flex-col"
        >
          <div className="flex h-[73px] items-center border-b border-[#232f48] px-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600/15 text-blue-300 shadow-[0_0_24px_rgba(19,91,236,0.28)]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">SolStudy</p>
                  <p className="text-xs text-[#556987]">Productivity mode</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-[#92a4c9] transition hover:bg-[#232f48] hover:text-white"
                aria-label="Collapse sidebar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <nav className="space-y-1 border-b border-[#232f48] p-3">
            {primaryItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-blue-500/40 bg-blue-600/15 text-white"
                      : "border-transparent text-[#92a4c9] hover:border-[#232f48] hover:bg-[#1a2332] hover:text-white"
                  }`}
                >
                  <item.icon size={17} />
                  {item.label}
                </Link>
              );
            })}
            {secondaryItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  href={item.href}
                  key={item.label}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "border-blue-500/40 bg-blue-600/15 text-white"
                      : "border-transparent text-[#92a4c9] hover:border-[#232f48] hover:bg-[#1a2332] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon size={17} />
                    {item.label}
                  </span>
                  <span className="rounded-full bg-[#232f48] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#556987]">
                    Soon
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 [scrollbar-color:#33415f_#111722] [scrollbar-width:thin]">
            <div className="rounded-2xl border border-[#232f48] bg-[#1a2332] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
                Today Stats
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#111722] p-3 text-center">
                  <p className="text-lg font-semibold text-white">{stats.totalTasksToday}</p>
                  <p className="mt-1 text-[10px] text-[#92a4c9]">Tasks</p>
                </div>
                <div className="rounded-xl bg-[#111722] p-3 text-center">
                  <p className="text-lg font-semibold text-emerald-300">{stats.completedTasks}</p>
                  <p className="mt-1 text-[10px] text-[#92a4c9]">Done</p>
                </div>
                <div className="rounded-xl bg-[#111722] p-3 text-center">
                  <p className="text-lg font-semibold text-blue-300">{stats.totalFocusSessions}</p>
                  <p className="mt-1 text-[10px] text-[#92a4c9]">Focus</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300">
                  <Flame size={19} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Focus Rhythm</p>
                  <p className="text-xs text-[#92a4c9]">
                    {longBreakDue ? "Long break is due" : "Work in 25 minute sprints"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#232f48] p-3">
            <div className="rounded-2xl border border-[#232f48] bg-[#1a2332]/80 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#111722] text-[#92a4c9]">
                  <UserRound size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{userLabel}</p>
                  <p className="truncate text-xs text-[#556987]">{userSubLabel}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#232f48] pt-3">
                <ModeToggle />
                <button
                  type="button"
                  onClick={() => {
                    authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          router.push("/login");
                        },
                      },
                    });
                  }}
                  className="flex h-9 items-center gap-2 rounded-xl border border-[#33415f] bg-[#111722] px-3 text-sm font-semibold text-[#c5d3ef] transition hover:bg-red-500/10 hover:text-red-200"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
