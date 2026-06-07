"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@solstudy/ui/components/dropdown-menu";
import { Check, ChevronDown } from "lucide-react";

export type CustomSelectOption = {
  value: string;
  label: string;
  color?: string | null;
};

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
}: {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-[#232f48] bg-[#111722] py-2 pr-2.5 pl-3 text-left text-sm text-white outline-none transition hover:border-blue-500/40 focus-visible:border-blue-500/60"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          {selectedOption?.color ? (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: selectedOption.color }}
            />
          ) : null}
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        </span>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[#92a4c9]">
          <ChevronDown size={16} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        positionerClassName="z-[80]"
        className="w-[var(--anchor-width)] rounded-xl border border-[#232f48] bg-[#111722] p-1 text-[#c5d3ef] shadow-xl"
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm focus:bg-[#1a2332] focus:text-white"
          >
            <span className="flex min-w-0 items-center gap-2">
              {option.color ? (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
              ) : null}
              <span className="truncate">{option.label}</span>
            </span>
            {option.value === value ? <Check size={15} className="text-blue-300" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
