import * as React from "react"

import { getRelatedSkills } from "@/lib/skills/related"
import { RelatedSkills } from "@/features/skills/related-skills"

type RelatedSkillsSectionProps = {
  skillId: string
  title?: string
}

async function RelatedSkillsSection({
  skillId,
  title,
}: RelatedSkillsSectionProps) {
  const relatedResult = await getRelatedSkills(skillId)
  const relatedSkills = relatedResult?.related ?? []

  return <RelatedSkills skills={relatedSkills} title={title} />
}

export { RelatedSkillsSection }
