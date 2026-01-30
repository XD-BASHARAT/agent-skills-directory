"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/features/skills/copy-button";

type PackageManager = "bun" | "npx" | "pnpm" | "yarn";

type InstallCommandProps = {
  owner: string;
  repo: string;
  skillName: string;
  variant?: "default" | "compact";
};

const PACKAGE_MANAGERS: {
  id: PackageManager;
  label: string;
  color: string;
}[] = [
  { id: "bun", label: "bun", color: "text-amber-500" },
  { id: "npx", label: "npx", color: "text-red-500" },
  { id: "pnpm", label: "pnpm", color: "text-orange-500" },
  { id: "yarn", label: "yarn", color: "text-sky-500" },
];

function getInstallCommand(
  pm: PackageManager,
  owner: string,
  repo: string,
  skillName: string,
): string {
  const args = `${owner}/${repo} -s ${skillName}`;
  switch (pm) {
    case "bun":
      return `bunx add-skill ${args}`;
    case "npx":
      return `npx add-skill ${args}`;
    case "pnpm":
      return `pnpm dlx add-skill ${args}`;
    case "yarn":
      return `yarn dlx add-skill ${args}`;
  }
}

function InstallCommand({ owner, repo, skillName, variant = "default" }: InstallCommandProps) {
  const [selected, setSelected] = React.useState<PackageManager>("bun");
  const command = getInstallCommand(selected, owner, repo, skillName);
  const selectedPm = PACKAGE_MANAGERS.find((pm) => pm.id === selected)!;

  if (variant === "compact") {
    return (
      <div className="space-y-3">
        {/* Package Manager Tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg w-fit" role="tablist" aria-label="Package manager">
          {PACKAGE_MANAGERS.map((pm) => (
            <button
              key={pm.id}
              type="button"
              onClick={() => setSelected(pm.id)}
              role="tab"
              aria-selected={selected === pm.id}
              tabIndex={selected === pm.id ? 0 : -1}
              className={cn(
                "relative flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md transition-[background-color,border-color,box-shadow,color] duration-200",
                selected === pm.id
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              )}
            >
              {selected === pm.id && (
                <span
                  className={cn(
                    "absolute inset-x-2 -bottom-px h-0.5 rounded-full",
                    pm.color.replace("text-", "bg-"),
                  )}
                />
              )}
              {pm.label}
            </button>
          ))}
        </div>

        {/* Command Display */}
        <div className="group relative rounded-xl bg-muted/50 dark:bg-muted/30 border border-border/50 p-3 overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 transition-colors duration-200",
                  selectedPm.color,
                )}
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <pre className="font-mono text-xs leading-relaxed overflow-x-auto scrollbar-none min-w-0">
                <code className="flex items-center gap-1">
                  <span className={cn("font-semibold shrink-0", selectedPm.color)}>
                    {command.split(" ")[0]}
                  </span>
                  <span className="text-muted-foreground truncate">
                    {command.split(" ").slice(1).join(" ")}
                  </span>
                </code>
              </pre>
            </div>
            <CopyButton text={command} variant="prominent" label="Copy" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-gradient-to-b from-card to-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-6 rounded-md bg-primary/10">
            <svg
              className="size-3.5 text-primary"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path d="M4 17l6-6-6-6M12 19h8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-medium">Quick Install</span>
        </div>
        <CopyButton text={command} variant="prominent" label="Copy" />
      </div>

      {/* Package Manager Tabs */}
      <div className="px-4 pt-3 pb-2">
        <div className="inline-flex items-center gap-0.5 p-1 bg-muted/60 rounded-lg" role="tablist" aria-label="Package manager">
          {PACKAGE_MANAGERS.map((pm) => (
            <button
              key={pm.id}
              type="button"
              onClick={() => setSelected(pm.id)}
              role="tab"
              aria-selected={selected === pm.id}
              tabIndex={selected === pm.id ? 0 : -1}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-[background-color,border-color,box-shadow,color] duration-200",
                selected === pm.id
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
              )}
            >
              {selected === pm.id && (
                <span
                  className={cn(
                    "absolute inset-x-2 -bottom-px h-0.5 rounded-full",
                    pm.color.replace("text-", "bg-"),
                  )}
                />
              )}
              {pm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Command Display */}
      <div className="px-4 pb-4">
        <div className="relative rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/50 p-3.5 overflow-hidden">
          <div className="flex items-start gap-2.5">
            <ChevronRight
              className={cn(
                "size-4 mt-0.5 shrink-0 transition-colors duration-200",
                selectedPm.color,
              )}
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto scrollbar-none">
              <code>
                <span className={cn("font-semibold", selectedPm.color)}>
                  {command.split(" ")[0]}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  {command.split(" ").slice(1).join(" ")}
                </span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export { InstallCommand };
