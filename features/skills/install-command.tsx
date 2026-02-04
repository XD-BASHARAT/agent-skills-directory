"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { CopyButton } from "@/features/skills/copy-button";

type InstallCommandProps = {
  owner: string;
  repo: string;
  skillName: string;
  variant?: "default" | "compact";
};

function getInstallCommand(owner: string, repo: string, skillName: string): string {
  const normalizedSkill = /\s/.test(skillName)
    ? `"${skillName.replace(/"/g, '\\"')}"`
    : skillName;
  return `npx skills add ${owner}/${repo} --skill ${normalizedSkill}`;
}

function InstallCommand({ owner, repo, skillName, variant = "default" }: InstallCommandProps) {
  const command = getInstallCommand(owner, repo, skillName);

  if (variant === "compact") {
    return (
      <div className="space-y-3">
        {/* Command Display */}
        <div className="group relative rounded-xl bg-muted/50 dark:bg-muted/30 border border-border/50 p-3 overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <ChevronRight
                className="size-3.5 shrink-0 text-primary transition-colors duration-200 motion-reduce:transition-none"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              <pre className="font-mono text-xs leading-relaxed overflow-x-auto scrollbar-none min-w-0 flex-1">
                <code className="flex items-center gap-1">
                  <span className="font-semibold shrink-0 text-primary">
                    {command.split(" ")[0]}
                  </span>
                  <span className="text-muted-foreground break-words">
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
              aria-hidden="true"
              focusable="false"
            >
              <path d="M4 17l6-6-6-6M12 19h8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-medium">Quick Install</span>
        </div>
        <CopyButton text={command} variant="prominent" label="Copy" />
      </div>

      {/* Command Display */}
      <div className="px-4 pb-4">
        <div className="relative rounded-lg bg-muted/40 dark:bg-muted/20 border border-border/50 p-3.5 overflow-hidden">
          <div className="flex items-start gap-2.5">
            <ChevronRight
              className="size-4 mt-0.5 shrink-0 text-primary transition-colors duration-200 motion-reduce:transition-none"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            <pre className="font-mono text-sm leading-relaxed overflow-x-auto scrollbar-none flex-1 min-w-0">
              <code className="flex items-center gap-1">
                <span className="font-semibold shrink-0 text-primary">
                  {command.split(" ")[0]}
                </span>
                <span className="text-muted-foreground break-words">
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
