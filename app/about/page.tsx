import Link from "next/link"
import { Container } from "@/components/layouts/container"
import { buildMetadata } from "@/lib/seo"
import { SubmitSkillDialog } from "@/features/submissions/submit-skill-dialog"
import { getExternalUrl } from "@/lib/utils"

export const metadata = buildMetadata({
  title: "About",
  description:
    "Learn about Agent Skills Directory - the community-driven platform for discovering and sharing AI coding agent skills.",
  path: "/about",
})

export default function AboutPage() {
  return (
    <Container size="md">
      <div>
        <h1 className="text-lg font-semibold">About Agent Skills Directory</h1>
        <p className="text-muted-foreground text-sm">Learn more about our platform</p>
      </div>

      <div className="space-y-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Agent Skills Directory is a community-driven platform for discovering, browsing, and sharing skills for AI coding agents like Claude, Cursor, Windsurf, and Amp Code.
        </p>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">What are Agent Skills?</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Agent Skills are specialized instructions and workflows that extend the capabilities of AI coding assistants. They provide domain-specific knowledge, best practices, and automation patterns that help AI agents perform complex tasks more effectively.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Our Mission</h2>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Create a central hub for discovering high-quality agent skills</li>
            <li>Foster a community of developers sharing their expertise</li>
            <li>Promote best practices in AI-assisted development</li>
            <li>Make it easy to find the right skill for any task</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">How It Works</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Skills are stored in GitHub repositories following the <a href={getExternalUrl("https://agentskills.io")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Agent Skills specification</a>. Each skill includes:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong className="text-foreground">SKILL.md</strong> - The main skill file with instructions and workflows</li>
            <li><strong className="text-foreground">Frontmatter metadata</strong> - Name, description, compatibility info</li>
            <li><strong className="text-foreground">Optional resources</strong> - Scripts, templates, and reference files</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Contributing</h2>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li><Link href="/skills" className="text-primary hover:underline">Submit your own skills</Link> to the directory (use the button in header)</li>
            <li>Report issues or suggest improvements on GitHub</li>
            <li>Help improve existing skills with better documentation</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Open Source</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This project is open source and built with transparency in mind. We believe in the power of community-driven development and welcome contributions of all kinds.
          </p>
        </section>

        <div className="flex gap-2 pt-2">
          <Link
            href="/skills"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-7 items-center rounded-md px-3 text-xs font-medium transition-colors"
          >
            Browse Skills
          </Link>
<SubmitSkillDialog buttonSize="sm" />
        </div>
      </div>
    </Container>
  )
}
