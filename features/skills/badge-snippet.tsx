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
        className="w-full flex items-center justify-between group"
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
            "size-3.5 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )} 
        />
      </button>

      {expanded && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[10px] text-muted-foreground">
            Add to your README
          </p>
          <div 
            className="group relative rounded-md border border-border/50 bg-muted/30 p-2 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={copyToClipboard}
          >
            <code className="text-[10px] text-foreground/70 break-all font-mono leading-relaxed">
              {markdownSnippet}
            </code>
            <div className={cn(
              "absolute inset-0 flex items-center justify-center rounded-md transition-opacity",
              copied ? "bg-green-500/10 opacity-100" : "bg-primary/5 opacity-0 group-hover:opacity-100"
            )}>
              {copied ? (
                <span className="flex items-center gap-1 text-[10px] font-medium text-green-600 dark:text-green-400">
                  <Check className="size-3" />
                  Copied!
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-medium text-primary">
                  <Copy className="size-3" />
                  Click to copy
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { BadgeSnippet }
