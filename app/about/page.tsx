import Link from "next/link"
import { Container } from "@/components/layouts/container"
import { buildMetadata } from "@/lib/seo"
import { SubmitSkillDialog } from "@/features/submissions/submit-skill-dialog"
import { getExternalUrl } from "@/lib/utils"

export const metadata = buildMetadata({
  title: "About",
  description:
    "Learn how Agent Skills Directory indexes SKILL.md skills and how to contribute.",
  path: "/about",
})

export default function AboutPage() {
  return (
    <Container size="md">
      <div>
        <h1 className="text-lg font-semibold">About Agent Skills Directory</h1>
        <p className="text-muted-foreground text-sm">How it works and how to contribute</p>
      </div>

      <div className="space-y-6">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Agent Skills Directory indexes SKILL.md skills from public GitHub repositories. Each entry links to the source repo and shows compatibility, stars, and recent activity so you can compare and decide.
        </p>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">What are Agent Skills?</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            An Agent Skill is a SKILL.md file that describes a repeatable workflow for a coding assistant. Skills can also include scripts and templates to make setup and execution consistent.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Our Mission</h2>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Index public SKILL.md skills with clear attribution</li>
            <li>Surface practical signals like stars, recency, and compatibility</li>
            <li>Use search and categories to narrow the list</li>
            <li>Show install commands and source links</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">How It Works</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Skills live in GitHub repositories following the <a href={getExternalUrl("https://agentskills.io")} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Agent Skills specification</a>. We parse the SKILL.md frontmatter, pull repo stats, and provide the install command and raw file.
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
            <li><Link href="/skills" className="text-primary hover:underline">Submit a repo or SKILL.md path</Link> using the header button</li>
            <li>Report broken links or incorrect metadata on GitHub</li>
            <li>Improve existing skills with clearer docs and examples</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Open Source</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This project is open source and built in the open. Contributions, fixes, and feedback are welcome.
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
