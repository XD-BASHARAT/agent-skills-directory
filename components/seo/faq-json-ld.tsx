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
          text: "Agent Skills are modular capabilities that extend AI coding assistants. Each skill consists of a SKILL.md file with instructions, plus optional scripts and templates. Skills are model-invoked—the AI automatically decides when to use them based on context.",
        },
      },
      {
        "@type": "Question",
        name: "Which AI coding tools support Agent Skills?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Agent Skills are compatible with Claude Code (Anthropic), Cursor, Windsurf, Amp Code, GitHub Copilot, OpenAI Codex CLI, and other tools that support the open SKILL.md standard.",
        },
      },
      {
        "@type": "Question",
        name: "How do I install an Agent Skill?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can install skills using a simple command in your terminal. Each skill page provides the installation command. For Claude Code users, you can use '/install owner/repo' directly.",
        },
      },
      {
        "@type": "Question",
        name: "Can I create and share my own skills?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! You can create custom skills and share them on GitHub. The basic structure requires a SKILL.md file with instructions. You can also add optional scripts, templates, and a marketplace.json for easier distribution.",
        },
      },
    ],
  }

  return <JsonLd data={faqPage} />
}

export { FaqJsonLd }
