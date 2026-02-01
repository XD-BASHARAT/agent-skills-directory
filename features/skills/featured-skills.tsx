import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SkillCard } from "@/features/skills/skill-card";
import type { Skill } from "@/types";

const FEATURED_SKILLS: Partial<Skill>[] = [
  {
    name: "building-skills",
    description:
      "Use when creating any skill/agent skill. Provides required structure, naming conventions, and frontmatter format.",
    owner: "anthropics",
    repo: "skills",
    path: "skills/building-skills/SKILL.md",
    url: "https://github.com/anthropics/skills/tree/main/skills/building-skills",
    rawUrl:
      "https://raw.githubusercontent.com/anthropics/skills/main/skills/building-skills/SKILL.md",
    stars: 1200,
    avatarUrl: "https://avatars.githubusercontent.com/u/76263028",
  },
  {
    name: "web-browser",
    description:
      "Interactive web browsing skill for navigating websites, filling forms, and extracting data.",
    owner: "anthropics",
    repo: "skills",
    path: "skills/web-browser/SKILL.md",
    url: "https://github.com/anthropics/skills/tree/main/skills/web-browser",
    rawUrl:
      "https://raw.githubusercontent.com/anthropics/skills/main/skills/web-browser/SKILL.md",
    stars: 980,
    avatarUrl: "https://avatars.githubusercontent.com/u/76263028",
  },
  {
    name: "mcp-server-builder",
    description:
      "Build MCP (Model Context Protocol) servers to extend agent capabilities with custom tools.",
    owner: "anthropics",
    repo: "skills",
    path: "skills/mcp-server-builder/SKILL.md",
    url: "https://github.com/anthropics/skills/tree/main/skills/mcp-server-builder",
    rawUrl:
      "https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-server-builder/SKILL.md",
    stars: 850,
    avatarUrl: "https://avatars.githubusercontent.com/u/76263028",
  },
];

function FeaturedSkills() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Featured Skills</h2>
        <Link
          href="/skills"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View All
          <ArrowRight className="size-3" aria-hidden="true" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {FEATURED_SKILLS.map((skill) => (
          <SkillCard
            key={`${skill.owner}/${skill.repo}/${skill.name}`}
            skill={skill as Skill}
          />
        ))}
      </div>
    </section>
  );
}

export { FeaturedSkills };
