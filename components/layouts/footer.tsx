import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { getExternalUrl } from "@/lib/utils"
import { ExternalImage } from "@/components/ui/external-image"

function Footer() {
  return (
    <footer className="border-border-subtle bg-background/95 supports-[backdrop-filter]:bg-background/60 border-t backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-2">
        <div className="flex flex-nowrap items-center justify-center gap-1.5 overflow-x-auto">
          <a href={getExternalUrl("https://wired.business")} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://wired.business/badge0-white.svg"
              alt="Featured on Wired Business"
              width={130}
              height={35}
              style={{ height: "auto" }}
              unoptimized
            />
          </a>
          <a href={getExternalUrl("https://twelve.tools")} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://twelve.tools/badge0-white.svg"
              alt="Featured on Twelve Tools"
              width={130}
              height={35}
              style={{ height: "auto" }}
              unoptimized
            />
          </a>
          <a href={getExternalUrl("https://uno.directory")} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://uno.directory/uno-directory.svg"
              alt="Listed on Uno Directory"
              width={80}
              height={20}
              style={{ height: "auto" }}
              unoptimized
            />
          </a>
          <a
            href={getExternalUrl("https://startupfa.me/s/agnxi.com-227?utm_source=agnxi.com")}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalImage
              src="https://startupfa.me/badges/featured-badge.webp"
              alt="AGNXI - Featured on Startup Fame"
              width={110}
              height={35}
            />
          </a>
          <a href={getExternalUrl("https://verifieddr.com/website/agnxi-com")} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://verifieddr.com/badge/agnxi-com.svg"
              alt="Verified DR - Verified Domain Rating for agnxi.com"
              width={140}
              height={43}
              style={{ height: "auto" }}
              unoptimized
            />
          </a>
          <a href={getExternalUrl("https://startuptrusted.com?ref=agnxi.com")} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://startuptrusted.com/api/badge?type=featured&style=light"
              alt="AGNXI on StartupTrusted"
              width={155}
              height={35}
              style={{ height: "auto" }}
              unoptimized
            />
          </a>
          <a href={getExternalUrl("https://famed.tools/products/agnxi?utm_source=famed.tools")} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://famed.tools/badges/famed-tools-badge-light.svg"
              alt="Featured on famed.tools"
              width={100}
              height={35}
              style={{ height: "auto" }}
              unoptimized
            />
          </a>
          <a href={getExternalUrl("https://aidirs.best")} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://aidirs.best/light.svg"
              alt="Featured on Aidirs"
              width={130}
              height={36}
              style={{ height: "auto" }}
              unoptimized
            />
          </a>
          <a href={getExternalUrl("https://turbo0.com/item/agnxi")} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://img.turbo0.com/badge-listed-light.svg"
              alt="Listed on Turbo0"
              width={100}
              height={35}
              style={{ height: "auto" }}
              unoptimized
            />
          </a>
          <a href={getExternalUrl("https://ufind.best/products/agnxi?utm_source=ufind.best")} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://ufind.best/badges/ufind-best-badge-light.svg"
              alt="Featured on ufind.best"
              width={100}
              height={35}
              style={{ height: "auto" }}
              unoptimized
            />
          </a>
          <a href={getExternalUrl("https://code.market?code.market=verified")} target="_blank" rel="noopener noreferrer">
            <Image
              src="https://code.market/assets/manage-product/featured-logo-bright.svg"
              alt="ai tools code.market"
              title="ai tools code.market"
              width={120}
              height={35}
              style={{ height: "auto" }}
              unoptimized
            />
          </a>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <Link href="/about" prefetch={false} className="text-link hover:text-foreground transition-colors">
              About
            </Link>
            <span className="text-border/50" aria-hidden="true">
              &middot;
            </span>
            <Link href="/privacy" prefetch={false} className="text-link hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span className="text-border/50" aria-hidden="true">
              &middot;
            </span>
            <Link href="/cookies" prefetch={false} className="text-link hover:text-foreground transition-colors">
              Cookies
            </Link>
            <span className="text-border/50" aria-hidden="true">
              &middot;
            </span>
            <Link href="/terms" prefetch={false} className="text-link hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
          <p className="text-muted-foreground text-xs">
            Built with{" "}
            <a
              href={getExternalUrl("https://github.com/doanbactam/agent-skills-directory")}
              className="text-link text-foreground/80 hover:text-foreground transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
