"use client"

import * as React from "react"
import Image from "next/image"
import { Check, Copy, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"

type BadgeSnippetProps = {
  owner: string
  slug: string
  className?: string
}

function BadgeSnippet({ owner, slug, className }: BadgeSnippetProps) {
  const [copied, setCopied] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const snippetId = React.useId()

  const skillUrl = `${siteConfig.url}/${owner}/skills/${slug}`
  const badgeUrl = `${siteConfig.url}/badge.svg`
  const markdownSnippet = `[![Featured on AGNXI](${badgeUrl})](${skillUrl})`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdownSnippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = markdownSnippet
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={snippetId}
        className="w-full flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="flex items-center gap-2">
          <Image
            src="/badge.svg"
            alt="Featured on AGNXI"
            width={120}
            height={22}
            className="dark:hidden"
            unoptimized
          />
          <Image
            src="/badge-dark.svg"
            alt="Featured on AGNXI"
            width={120}
            height={22}
            className="hidden dark:block"
            unoptimized
          />
        </div>
        <ChevronDown 
          className={cn(
            "size-3.5 text-muted-foreground transition-transform motion-reduce:transition-none",
            expanded && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {expanded && (
        <div id={snippetId} className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none">
          <p className="text-[10px] text-muted-foreground">
            Add to your README
          </p>
          <button 
            type="button"
            aria-label="Copy badge snippet"
            className="group relative w-full rounded-md border border-border/50 bg-muted/30 p-2 text-left hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={copyToClipboard}
          >
            <code className="text-[10px] text-foreground/70 break-all font-mono leading-relaxed">
              {markdownSnippet}
            </code>
            <div className={cn(
              "absolute inset-0 flex items-center justify-center rounded-md transition-opacity motion-reduce:transition-none",
              copied ? "bg-green-500/10 opacity-100" : "bg-primary/5 opacity-0 group-hover:opacity-100"
            )} role="status" aria-live="polite">
              {copied ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                  <Check className="size-3" aria-hidden="true" />
                  Copied!
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
                  <Copy className="size-3" aria-hidden="true" />
                  Click to copy
                </span>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

export { BadgeSnippet }
