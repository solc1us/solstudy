import { Button } from "@solstudy/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@solstudy/ui/components/dropdown-menu";
import { Skeleton } from "@solstudy/ui/components/skeleton";
import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function UserMenu() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-28 rounded-xl bg-[#232f48]" />;
  }

  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-xl border border-[#33415f] bg-[#1a2332] px-3 py-2 text-sm font-semibold text-[#c5d3ef] transition hover:text-white"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Register
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="h-9 rounded-xl border-[#33415f] bg-[#1a2332] px-3 text-[#c5d3ef] hover:bg-[#232f48] hover:text-white"
          />
        }
      >
        <UserRound size={15} />
        <span className="max-w-32 truncate">{session.user.name || session.user.email}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-xl border border-[#232f48] bg-[#111722] p-1 text-[#c5d3ef] shadow-xl"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2 text-xs text-[#556987]">
            {session.user.name || "My Account"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#232f48]" />
          <DropdownMenuItem className="rounded-lg px-3 py-2 text-xs text-[#92a4c9] focus:bg-[#1a2332] focus:text-white">
            {session.user.email}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className="rounded-lg px-3 py-2 text-red-300 focus:bg-red-500/10 focus:text-red-200"
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.push("/");
                  },
                },
              });
            }}
          >
            <LogOut size={15} />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
