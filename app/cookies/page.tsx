import Link from "next/link"
import { Container } from "@/components/layouts/container"
import { buildMetadata } from "@/lib/seo"

export const metadata = buildMetadata({
  title: "Cookie Policy",
  description: "Cookie Policy for Agent Skills Directory.",
  path: "/cookies",
})

export default function CookiePolicyPage() {
  return (
    <Container size="md">
      <div>
        <h1 className="text-lg font-semibold">Cookie Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated: January 22, 2026</p>
      </div>

      <div className="space-y-6">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This Cookie Policy explains how Agent Skills Directory uses cookies and similar
          technologies. It is provided in accordance with EU and UK privacy rules
          (including the ePrivacy Directive and GDPR/UK GDPR).
        </p>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">What Are Cookies?</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Cookies are small text files stored on your device by your browser. They help
            websites function and remember your preferences.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Cookies We Use</h2>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>
              <strong className="text-foreground">Essential cookies</strong>: Required to
              operate the site and keep it secure.
            </li>
            <li>
              <strong className="text-foreground">Preference cookies</strong>: Store your
              consent choice for non-essential cookies.
            </li>
            <li>
              <strong className="text-foreground">Analytics/marketing cookies</strong>: We
              do not set these by default. If we add them in the future, we will only
              enable them with your consent.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Your Choices</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You can accept or reject non-essential cookies via the cookie banner. You can
            also clear cookies in your browser at any time. If you reject non-essential
            cookies, the site will still function, but some features may be limited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Contact</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            If you have questions about this Cookie Policy, please contact us through our
            GitHub repository.
          </p>
        </section>

        <div className="pt-2 flex gap-3">
          <Link href="/" className="text-xs text-primary text-link">
            {"<- Back to Home"}
          </Link>
          <Link href="/privacy" className="text-xs text-primary text-link">
            Privacy Policy
          </Link>
        </div>
      </div>
    </Container>
  )
}
