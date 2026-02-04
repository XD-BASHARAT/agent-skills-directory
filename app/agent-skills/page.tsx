import Link from "next/link"

import { Container } from "@/components/layouts/container"
import { BreadcrumbsJsonLd } from "@/components/seo/breadcrumbs-json-ld"
import { JsonLd } from "@/components/seo/json-ld"
import { Button } from "@/components/ui/button"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Agent Skills Guide",
  description:
    "Learn what agent skills are, how SKILL.md workflows work, and how to install and choose the right agent skills for your coding assistant.",
  path: "/agent-skills",
  keywords: [
    "agent skills",
    "agent skills guide",
    "agent skills directory",
    "SKILL.md",
    "coding assistant skills",
    "install agent skills",
  ],
})

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What are agent skills?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Agent skills are SKILL.md workflows that tell a coding assistant how to complete a repeatable task with clear steps, inputs, and outputs.",
      },
    },
    {
      "@type": "Question",
      name: "Where do agent skills live?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Most agent skills live in public GitHub repositories as a SKILL.md file, often with optional scripts, templates, and examples.",
      },
    },
    {
      "@type": "Question",
      name: "How do I install an agent skill?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Open a skill page, copy the install command, and run it in your terminal or coding tool. The standard command is: npx skills add owner/repo. Add --skill \"Skill Name\" to install specific skills.",
      },
    },
    {
      "@type": "Question",
      name: "Which tools support agent skills?",
      acceptedAnswer: {
        "@type": "Answer",
        text:
          "Agent skills work with Claude Code, Cursor, Windsurf, Amp Code, GitHub Copilot, OpenAI Codex CLI, and other assistants that follow the SKILL.md standard.",
      },
    },
  ],
}

export default function AgentSkillsPage() {
  return (
    <Container size="lg" spacing="lg">
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Agent Skills Guide", url: "/agent-skills" },
        ]}
      />
      <JsonLd data={faqJsonLd} />

      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Guide
        </p>
        <h1 className="text-balance text-2xl font-bold tracking-tight">
          Agent Skills Guide
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Agent skills are SKILL.md workflows that teach coding assistants how to complete
          repeatable tasks. Use this guide to understand how agent skills work, how to
          install them, and how to pick the right skill for your workflow.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">What are agent skills?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Agent skills are structured instructions stored in SKILL.md files. They define the
          steps, inputs, and outputs needed for a coding assistant to perform a task like
          generating tests, refactoring a module, or preparing a release checklist.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How agent skills work</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Each skill includes frontmatter metadata such as name, description, and compatibility.</li>
          <li>The SKILL.md body explains the workflow and expected outputs.</li>
          <li>Optional scripts and templates keep execution consistent.</li>
          <li>Install commands make it easy to add skills to your tool.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How to install agent skills</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
          <li>Open a skill page in the agent skills directory.</li>
          <li>Copy the install command for your tool (e.g. `npx skills add owner/repo`).</li>
          <li>Run the command in your terminal or inside the assistant.</li>
          <li>Start the skill and follow the workflow steps.</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">How to choose the right agent skills</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>Check compatibility with your coding assistant.</li>
          <li>Review stars, forks, and recent updates for quality signals.</li>
          <li>Read the SKILL.md instructions before installing.</li>
          <li>Start with one clear task and expand from there.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Supported tools</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Agent skills work with Claude Code, Cursor, Windsurf, Amp Code, GitHub Copilot, and
          OpenAI Codex CLI. Any tool that follows the SKILL.md standard can support agent skills.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Agent skills FAQ</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Do agent skills replace prompts?</p>
            <p>
              Agent skills are reusable workflows that bundle prompts, steps, and resources so
              you do not need to rewrite instructions every time.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Can I publish my own agent skills?</p>
            <p>
              Yes. Create a SKILL.md file, add any supporting scripts, and publish it in a
              public GitHub repository.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Are agent skills free to use?</p>
            <p>
              Most agent skills in the directory are open source. Always review the repo
              license before reuse.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border-subtle bg-card/40 p-4 sm:p-5">
        <h2 className="text-lg font-semibold">Ready to explore agent skills?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Browse the directory to discover agent skills by category, tool, and workflow type.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/skills">Browse Agent Skills</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/categories">Agent Skills Categories</Link>
          </Button>
        </div>
      </section>
    </Container>
  )
}
