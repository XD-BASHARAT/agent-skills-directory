import * as React from "react"
import { getSiteUrl } from "@/lib/site-url"
import { siteName } from "@/lib/seo"
import { JsonLd } from "@/components/seo/json-ld"

type SkillStructuredDataProps = Readonly<{
  skill: {
    name: string
    description?: string | null
    owner: string
    repo: string
    slug: string
    path: string
    stars?: number | null
    forks?: number | null
    avatarUrl?: string | null
    compatibility?: string | null
    allowedTools?: string | null
    repoUpdatedAt?: Date | null
    indexedAt?: Date | null
  }
  categories?: Array<{ name: string; slug: string }>
}>

function SkillStructuredData({ skill, categories = [] }: SkillStructuredDataProps) {
  const siteUrl = getSiteUrl()
  const skillUrl = `${siteUrl}/${skill.owner}/skills/${skill.slug}`
  const githubUrl = `https://github.com/${skill.owner}/${skill.repo}/tree/main/${skill.path}`

  const allowedTools = skill.allowedTools ? JSON.parse(skill.allowedTools) : []
  const keywords = [
    skill.name,
    skill.compatibility,
    ...allowedTools,
    ...categories.map((c) => c.name),
  ].filter(Boolean)

  const softwareSourceCode = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    "@id": skillUrl,
    name: skill.name,
    description: skill.description,
    url: skillUrl,
    codeRepository: githubUrl,
    programmingLanguage: "Markdown",
    runtimePlatform: "Coding assistants",
    author: {
      "@type": "Person",
      name: skill.owner,
      url: `https://github.com/${skill.owner}`,
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl,
    },
    ...(skill.repoUpdatedAt && {
      dateModified: skill.repoUpdatedAt.toISOString(),
    }),
    ...(skill.indexedAt && {
      datePublished: skill.indexedAt.toISOString(),
    }),
    ...(keywords.length > 0 && { keywords: keywords.join(", ") }),
    ...(skill.avatarUrl && {
      image: skill.avatarUrl,
    }),
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: skill.stars ?? 0,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ForkAction",
        userInteractionCount: skill.forks ?? 0,
      },
    ],
  }

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Install ${skill.name}`,
    description: `Install the ${skill.name} skill for coding assistants`,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Copy install command",
        text: `Copy the installation command for ${skill.name}`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Run in terminal",
        text: "Paste and run the command in your terminal or coding tool",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Start using",
        text: "The skill is now available in your tool",
      },
    ],
    tool: [
      { "@type": "HowToTool", name: "Claude Code" },
      { "@type": "HowToTool", name: "Cursor" },
      { "@type": "HowToTool", name: "Windsurf" },
      { "@type": "HowToTool", name: "Amp Code" },
    ],
    totalTime: "PT1M",
  }

  return (
    <>
      <JsonLd data={softwareSourceCode} />
      <JsonLd data={howTo} />
    </>
  )
}

export { SkillStructuredData }
