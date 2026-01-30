import Link from "next/link"
import { Container } from "@/components/layouts/container"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "Terms of Service for Agent Skills Directory - the rules and guidelines for using our platform.",
  path: "/terms",
})

export default function TermsPage() {
  return (
    <Container size="md">
      <div>
        <h1 className="text-lg font-semibold">Terms of Service</h1>
        <p className="text-muted-foreground text-sm">Last updated: January 22, 2026</p>
      </div>

      <div className="space-y-6">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using Agent Skills Directory (&ldquo;Service&rdquo;). By accessing or using the Service, you agree to be bound by these Terms.
        </p>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">1. Acceptance of Terms</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            By accessing or using our Service, you agree to these Terms. If you disagree with any part of the Terms, you may not access the Service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">2. Description of Service</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Agent Skills Directory is a platform for discovering, browsing, and sharing skills for AI coding agents. We aggregate publicly available skills from GitHub repositories.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">3. User Responsibilities</h2>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Provide accurate information when submitting skills</li>
            <li>Only submit skills you have the right to share</li>
            <li>Not use the Service for any unlawful purpose</li>
            <li>Not attempt to disrupt or compromise the Service</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">4. Skill Submissions</h2>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>You represent that you have the right to submit the content</li>
            <li>You grant us permission to display and distribute the skill information</li>
            <li>You understand that submissions are publicly visible</li>
            <li>We reserve the right to remove any submission at our discretion</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">5. Intellectual Property</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Skills listed in our directory remain the intellectual property of their respective owners. We do not claim ownership of submitted skills.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">6. Disclaimer of Warranties</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">7. Contact</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If you have questions about these Terms, please contact us through our GitHub repository.
          </p>
        </section>

        <div className="flex gap-3 pt-2">
          <Link href="/" className="text-xs text-primary hover:underline">
            ← Back to Home
          </Link>
          <Link href="/privacy" className="text-xs text-primary hover:underline">
            Privacy Policy
          </Link>
        </div>
      </div>
    </Container>
  )
}
