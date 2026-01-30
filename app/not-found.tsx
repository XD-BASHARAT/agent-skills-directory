import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/layouts/container"
import { Button } from "@/components/ui/button"
import { Home, Compass } from "lucide-react"

export const metadata: Metadata = {
  title: "Not Found | Agent Skills Directory",
  description: "The page you're looking for doesn't exist.",
}

export default function NotFoundPage() {
  return (
    <Container>
      <div className="flex min-h-[60vh] items-center justify-center py-12">
        <div className="text-center space-y-8">
          {/* Cute Ghost Animation */}
          <div className="relative">
            <div className="animate-bounce">
              <div className="text-[120px] leading-none select-none">👻</div>
            </div>
            <div className="absolute -top-2 -right-4 animate-pulse">
              <span className="text-2xl">✨</span>
            </div>
            <div className="absolute top-8 -left-6 animate-pulse delay-150">
              <span className="text-xl">💫</span>
            </div>
          </div>

          {/* 404 Text */}
          <div className="space-y-2">
            <h1 className="text-7xl font-black bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              404
            </h1>
            <p className="text-xl font-medium text-foreground">
              Oops! This page has vanished~
            </p>
            <p className="text-muted-foreground max-w-md mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved somewhere else.
              Don&apos;t worry! 🌸
            </p>
          </div>

          {/* Cute Divider */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground/50">
            <span>・‥…━━━━━</span>
            <span className="text-lg">🎀</span>
            <span>━━━━━…‥・</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button size="lg" className="gap-2 rounded-full px-6">
                <Home className="size-4" aria-hidden="true" />
                Go Home
              </Button>
            </Link>
            <Link href="/skills">
              <Button variant="outline" size="lg" className="gap-2 rounded-full px-6">
                <Compass className="size-4" aria-hidden="true" />
                Explore Skills
              </Button>
            </Link>
          </div>

          {/* Fun Footer */}
          <p className="text-xs text-muted-foreground/60 pt-4">
            💡 Tip: Double-check the URL or use the search bar!
          </p>
        </div>
      </div>
    </Container>
  )
}
