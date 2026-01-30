import Link from "next/link"
import { Container } from "@/components/layouts/container"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "Privacy Policy for Agent Skills Directory - how we collect, use, and protect your information.",
  path: "/privacy",
})

export default function PrivacyPage() {
  return (
    <Container size="md">
      <div>
        <h1 className="text-lg font-semibold">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated: January 22, 2026</p>
      </div>

      <div className="space-y-6">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This Privacy Policy describes how Agent Skills Directory (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, and shares information when you use our website and services.
        </p>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Information We Collect</h2>
          <h3 className="text-xs font-medium text-foreground/80">Information You Provide</h3>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong className="text-foreground">Skill Submissions</strong>: When you submit a skill, we collect the GitHub repository URL and optional contact information you provide.</li>
            <li><strong className="text-foreground">Contact Information</strong>: If you contact us, we may collect your email address and message content.</li>
          </ul>
          <h3 className="text-xs font-medium text-foreground/80 pt-2">Automatically Collected Information</h3>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong className="text-foreground">Usage Data</strong>: We collect information about how you interact with our website.</li>
            <li><strong className="text-foreground">Device Information</strong>: We may collect information about your device, browser type, and operating system.</li>
            <li><strong className="text-foreground">Log Data</strong>: Our servers automatically record information including your IP address and access times.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">How We Use Your Information</h2>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Operate and maintain the Agent Skills Directory</li>
            <li>Process and display skill submissions</li>
            <li>Improve our website and services</li>
            <li>Respond to your inquiries and requests</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Protect against abuse and maintain security</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Cookies</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use essential cookies to operate the site and to remember your cookie
            preferences. We do not set analytics or marketing cookies by default. For
            details, see our{" "}
            <Link href="/cookies" className="text-primary hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Legal Bases (EU/UK)</h2>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <strong className="text-foreground">Legitimate interests</strong>: To
              operate, secure, and improve the Service.
            </li>
            <li>
              <strong className="text-foreground">Consent</strong>: For any non-essential
              cookies or optional features that require it.
            </li>
            <li>
              <strong className="text-foreground">Compliance with law</strong>: To meet
              legal obligations.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Information Sharing</h2>
          <p className="text-xs text-muted-foreground">We do not sell your personal information. We may share information in the following circumstances:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong className="text-foreground">Public Skills</strong>: Submitted skills and associated public repository information are displayed publicly.</li>
            <li><strong className="text-foreground">Service Providers</strong>: We may share information with third-party service providers.</li>
            <li><strong className="text-foreground">Legal Requirements</strong>: We may disclose information if required by law.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Your Rights</h2>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Object to or restrict processing of your information</li>
            <li>Withdraw consent at any time where processing is based on consent</li>
            <li>Lodge a complaint with your local data protection authority</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Contact Us</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If you have questions about this Privacy Policy, please contact us through our GitHub repository.
          </p>
        </section>

        <div className="pt-2">
          <Link href="/" className="text-xs text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </Container>
  )
}
