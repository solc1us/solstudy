"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

export default function Header() {
	const pathname = usePathname();
	if (pathname.startsWith("/study-mode")) {
		return null;
	}

	const links = [{ to: "/study-mode", label: "Study Mode" }] as const;

	return (
		<header className="border-b border-[#232f48] bg-[#111722]/95 text-white backdrop-blur">
			<div className="flex h-14 items-center justify-between px-4 sm:px-6">
				<div className="flex items-center gap-6">
					<Link href="/" className="flex items-center gap-2">
						<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/15 text-sm font-bold text-blue-200 shadow-[0_0_18px_rgba(19,91,236,0.22)]">
							S
						</span>
						<span className="text-sm font-semibold tracking-wide">
							SolStudy
						</span>
					</Link>
					{/* <nav className="hidden items-center gap-1 sm:flex">
          {links.map(({ to, label }) => {
            const isActive = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                href={to}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600/15 text-white"
                    : "text-[#92a4c9] hover:bg-[#1a2332] hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav> */}
				</div>
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
