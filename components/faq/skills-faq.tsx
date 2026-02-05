"use client"

import * as React from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

function SkillsFaq() {
  return (
    <section className="rounded-lg border border-border/50 bg-card/40 px-3.5 py-3">
      <h2 className="text-sm font-semibold text-foreground">FAQ</h2>
      <Accordion type="single" collapsible className="mt-1.5 w-full">
        <AccordionItem value="agent-skills">
          <AccordionTrigger className="text-xs">What are agent skills?</AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground text-pretty">
            Agent skills are SKILL.md workflows that teach coding assistants how to complete repeatable tasks. AGNXI indexes public agent skills, shows repo signals, and lets you install the workflow that fits your tool.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}

export { SkillsFaq }
