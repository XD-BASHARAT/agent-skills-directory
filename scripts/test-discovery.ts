/**
 * Quick Discovery Test - Tests basic discovery pipeline
 * Run: bun scripts/test-discovery.ts
 * 
 * Tests:
 * - Full discovery (code search + registries + topics)
 * - Repo metadata fetching
 * - Skill content parsing
 * - Owner verification
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { discoverAllSkills } from "@/lib/features/skills/discovery"
import { batchFetchRepoMetadata, batchFetchSkills } from "@/lib/features/skills/github-graphql"
import { batchFetchOwnersVerification } from "@/lib/features/skills/github-rest"
import { parseSkillMd } from "@/lib/features/skills/parser"
import { toCanonicalId } from "@/lib/features/skills/canonical"
import { checkRateLimit } from "@/lib/features/skills/github"

const MIN_STARS = 10
const MAX_SKILLS = 20

async function main() {
  console.log("🚀 Quick Discovery Test\n")

  // Check rate limit
  const rateLimit = await checkRateLimit()
  console.log("📊 Rate Limit:")
  console.log(`   Core: ${rateLimit.core.remaining}/${rateLimit.core.limit}`)
  console.log(`   Search: ${rateLimit.search.remaining}/${rateLimit.search.limit}\n`)

  if (rateLimit.search.remaining < 5) {
    console.error("❌ Not enough search quota. Try again later.")
    process.exit(1)
  }

  // Discover skills
  console.log("🔍 Discovering SKILL.md files...")
  const discovered = await discoverAllSkills({
    maxResults: MAX_SKILLS * 3,
    onProgress: (msg) => console.log(`   ${msg}`),
  })

  if (discovered.length === 0) {
    console.log("\n⚠️ No skills discovered.")
    process.exit(0)
  }

  console.log(`\n✅ Discovered: ${discovered.length} files\n`)
  console.log("Sample:")
  discovered.slice(0, 5).forEach((d, i) => {
    console.log(`   ${i + 1}. ${d.owner}/${d.repo}/${d.path}`)
  })
  console.log()

  // Get unique repos
  console.log("📦 Getting unique repos...")
  const repoMap = new Map<string, { owner: string; repo: string }>()
  for (const item of discovered) {
    const key = `${item.owner}/${item.repo}`.toLowerCase()
    if (!repoMap.has(key)) {
      repoMap.set(key, { owner: item.owner, repo: item.repo })
    }
  }
  const uniqueRepos = Array.from(repoMap.values())
  console.log(`   ${uniqueRepos.length} unique repos\n`)

  // Fetch metadata
  console.log("📡 Fetching repo metadata...")
  const repoMetadata = await batchFetchRepoMetadata(uniqueRepos)
  console.log(`   ${repoMetadata.size} repos fetched\n`)

  // Filter qualified
  console.log(`🔎 Filtering (minStars=${MIN_STARS})...`)
  const qualifiedItems: Array<{ owner: string; repo: string; path: string }> = []
  const filtered = { lowStars: 0, archived: 0, notFound: 0 }

  for (const item of discovered) {
    const meta = repoMetadata.get(`${item.owner}/${item.repo}`)
    if (!meta) { filtered.notFound++; continue }
    if (meta.stars < MIN_STARS) { filtered.lowStars++; continue }
    if (meta.isArchived) { filtered.archived++; continue }

    qualifiedItems.push({ owner: item.owner, repo: item.repo, path: item.path })
    if (qualifiedItems.length >= MAX_SKILLS) break
  }

  console.log(`   Qualified: ${qualifiedItems.length}`)
  console.log(`   Filtered: ${filtered.lowStars} low stars, ${filtered.archived} archived\n`)

  if (qualifiedItems.length === 0) {
    console.log("⚠️ No qualified skills.")
    process.exit(0)
  }

  // Fetch content
  console.log("📄 Fetching skill content...")
  const skillDataMap = await batchFetchSkills(qualifiedItems)
  console.log(`   ${skillDataMap.size} skills fetched\n`)

  // Fetch verification
  console.log("🔐 Checking owner verification...")
  const owners = [...new Set(qualifiedItems.map((i) => i.owner))]
  const ownerVerificationMap = await batchFetchOwnersVerification(owners)
  console.log(`   ${ownerVerificationMap.size} owners checked\n`)

  // Parse
  console.log("✅ Parsing SKILL.md files...")
  const parsedSkills: Array<{
    id: string
    name: string
    description: string
    owner: string
    repo: string
    stars: number
    isVerifiedOrg: boolean
  }> = []

  let parseErrors = 0
  let emptyContent = 0

  for (const item of qualifiedItems) {
    const lookupKey = `${item.owner}/${item.repo}/${item.path}`
    const data = skillDataMap.get(lookupKey)

    if (!data || !data.content) {
      emptyContent++
      continue
    }

    const parsed = parseSkillMd(data.content)
    if (!parsed.success) {
      parseErrors++
      console.log(`   ❌ Parse error: ${item.owner}/${item.repo} - ${parsed.error}`)
      continue
    }

    const canonicalId = toCanonicalId(item.owner, item.repo, item.path)

    parsedSkills.push({
      id: canonicalId,
      name: parsed.data.name,
      description: parsed.data.description,
      owner: item.owner.toLowerCase(),
      repo: item.repo.toLowerCase(),
      stars: data.stars,
      isVerifiedOrg: ownerVerificationMap.get(item.owner.toLowerCase()) ?? false,
    })
  }

  console.log(`   Parsed: ${parsedSkills.length}`)
  if (emptyContent > 0) console.log(`   Empty: ${emptyContent}`)
  if (parseErrors > 0) console.log(`   Errors: ${parseErrors}`)
  console.log()

  // Summary
  console.log("=" .repeat(50))
  console.log("📊 SUMMARY")
  console.log("=" .repeat(50))
  console.log(`Discovered: ${discovered.length} → Qualified: ${qualifiedItems.length} → Parsed: ${parsedSkills.length}`)
  console.log()

  // Show skills
  console.log("🎯 Skills:")
  parsedSkills.slice(0, 10).forEach((skill, i) => {
    const verified = skill.isVerifiedOrg ? "✓" : ""
    console.log(`${i + 1}. [${skill.stars}⭐${verified}] ${skill.name}`)
    console.log(`   ${skill.owner}/${skill.repo}`)
    console.log(`   ${skill.description.slice(0, 70)}...`)
    console.log()
  })

  if (parsedSkills.length > 10) {
    console.log(`... and ${parsedSkills.length - 10} more\n`)
  }

  console.log("✅ Test completed!")
}

main().catch((error) => {
  console.error("❌ Error:", error)
  process.exit(1)
})
