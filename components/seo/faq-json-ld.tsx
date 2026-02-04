import * as React from "react"
import { JsonLd } from "@/components/seo/json-ld"

function FaqJsonLd() {
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What are Agent Skills?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Agent Skills are SKILL.md instructions plus optional scripts and templates that define a workflow for a coding assistant. You can run them on demand, and some tools can invoke them automatically based on context.",
        },
      },
      {
        "@type": "Question",
        name: "Which tools support Agent Skills?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Agent Skills work with Claude Code, Cursor, Windsurf, Amp Code, GitHub Copilot, OpenAI Codex CLI, and any tool that supports the SKILL.md standard.",
        },
      },
      {
        "@type": "Question",
        name: "How do I install an Agent Skill?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Copy the install command from the skill page and run it in your terminal or tool. The standard command is: npx skills add owner/repo. Add --skill \"Skill Name\" to install specific skills.",
        },
      },
      {
        "@type": "Question",
        name: "Can I create and share my own skills?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Create a SKILL.md with frontmatter and instructions, add optional scripts or templates, and publish it on GitHub.",
        },
      },
    ],
  }

  return <JsonLd data={faqPage} />
}

export { FaqJsonLd }
