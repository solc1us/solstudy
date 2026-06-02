import { ArrowRight, Lightbulb, ListChecks, Timer } from "lucide-react";
import Link from "next/link";

const features = [
  { label: "Task planning", icon: ListChecks },
  { label: "Pomodoro focus", icon: Timer },
  { label: "Idea Vault", icon: Lightbulb },
] as const;

export default function Home() {
  return (
    <main className="flex min-h-0 flex-1 items-center bg-[#111722] px-4 py-8 text-white sm:px-6">
      <section className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
            SolStudy
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Plan your study tasks. Start focused sessions. Keep ideas out of your head.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#92a4c9] sm:text-lg">
            A focused study workspace with a practical to-do list, Pomodoro timer, and Idea
            Vault for thoughts that should not interrupt your session.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(19,91,236,0.3)] transition hover:bg-blue-500"
            >
              Get Started
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#33415f] bg-[#1a2332] px-5 text-sm font-semibold text-[#c5d3ef] transition hover:border-blue-400/40 hover:text-white"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-5 shadow-2xl shadow-black/20">
          <div className="rounded-2xl border border-[#232f48] bg-[#111722] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#556987]">
              Focus Stack
            </p>
            <div className="mt-4 space-y-3">
              {features.map((feature) => (
                <div
                  key={feature.label}
                  className="flex items-center gap-3 rounded-xl border border-[#232f48] bg-[#1a2332] p-3"
                >
                  <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-300">
                    <feature.icon size={18} />
                  </div>
                  <span className="text-sm font-semibold text-white">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
