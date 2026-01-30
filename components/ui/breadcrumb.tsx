import * as React from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbProps = Readonly<{
  items: BreadcrumbItem[]
  className?: string
}>

function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap",
        className
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <React.Fragment key={item.label}>
            {index > 0 && (
              <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
            )}
            {isLast || !item.href ? (
              <span
                className={cn(
                  isLast && "text-foreground font-medium"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}

export { Breadcrumb, type BreadcrumbItem }
