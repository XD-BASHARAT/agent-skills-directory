/**
 * Comprehensive Discovery Test - Tests all discovery methods
 * Run: bun scripts/test-discovery-full.ts
 * 
 * Tests:
 * 1. Code Search discovery (multi-query)
 * 2. Registry-based discovery
 * 3. Topic-based discovery
 * 4. Full discovery (all combined with deduplication)
 */

import { config } from "dotenv"
config({ path: ".env.local" })

import { 
  discoverSkillFiles, 
  discoverFromRegistries,
  discoverFromTopics,
  discoverAllSkills,
} from "@/lib/features/skills/discovery"
import { checkRateLimit } from "@/lib/features/skills/github"

async function main() {
  console.log("🚀 Comprehensive Discovery Test\n")

  // Check rate limit
  const rateLimit = await checkRateLimit()
  console.log("📊 Rate Limit:")
  console.log(`   Core: ${rateLimit.core.remaining}/${rateLimit.core.limit}`)
  console.log(`   Search: ${rateLimit.search.remaining}/${rateLimit.search.limit}\n`)

  if (rateLimit.search.remaining < 10) {
    console.error("❌ Not enough search quota (need 10+). Try again later.")
    process.exit(1)
  }

  const results = {
    codeSearch: 0,
    registries: 0,
    topics: 0,
    full: 0,
  }

  // Test 1: Code Search
  console.log("=" .repeat(50))
  console.log("TEST 1: Code Search Discovery")
  console.log("=" .repeat(50))
  
  const codeSearchResults = await discoverSkillFiles({
    maxResults: 50,
    onProgress: (msg) => console.log(msg),
  })
  results.codeSearch = codeSearchResults.length
  console.log(`\n✅ Code Search: ${results.codeSearch} skills\n`)

  // Test 2: Registries
  console.log("=" .repeat(50))
  console.log("TEST 2: Registry Discovery")
  console.log("=" .repeat(50))
  
  const registryResults = await discoverFromRegistries({
    maxResults: 30,
    onProgress: (msg) => console.log(msg),
  })
  results.registries = registryResults.length
  console.log(`\n✅ Registries: ${results.registries} skills\n`)

  // Test 3: Topics
  console.log("=" .repeat(50))
  console.log("TEST 3: Topic Discovery")
  console.log("=" .repeat(50))
  
  const topicResults = await discoverFromTopics({
    maxResults: 20,
    onProgress: (msg) => console.log(msg),
  })
  results.topics = topicResults.length
  console.log(`\n✅ Topics: ${results.topics} skills\n`)

  // Test 4: Full Discovery
  console.log("=" .repeat(50))
  console.log("TEST 4: Full Discovery (All Methods)")
  console.log("=" .repeat(50))
  
  const fullResults = await discoverAllSkills({
    maxResults: 100,
    onProgress: (msg) => console.log(msg),
  })
  results.full = fullResults.length
  console.log(`\n✅ Full: ${results.full} unique skills\n`)

  // Summary
  console.log("=" .repeat(50))
  console.log("📊 SUMMARY")
  console.log("=" .repeat(50))
  console.log(`Code Search:  ${results.codeSearch.toString().padStart(3)} skills`)
  console.log(`Registries:   ${results.registries.toString().padStart(3)} skills`)
  console.log(`Topics:       ${results.topics.toString().padStart(3)} skills`)
  console.log(`Full (Dedup): ${results.full.toString().padStart(3)} skills`)
  console.log()

  // Sample
  console.log("🎯 Sample (from Full Discovery):")
  fullResults.slice(0, 10).forEach((skill, i) => {
    console.log(`${i + 1}. ${skill.owner}/${skill.repo}`)
    console.log(`   ${skill.path}`)
  })
  
  if (fullResults.length > 10) {
    console.log(`... and ${fullResults.length - 10} more`)
  }
  console.log()

  // Final rate limit
  const finalRate = await checkRateLimit()
  console.log("📊 Rate Limit After Tests:")
  console.log(`   Core: ${finalRate.core.remaining}/${finalRate.core.limit}`)
  console.log(`   Search: ${finalRate.search.remaining}/${finalRate.search.limit}`)
  console.log()

  console.log("✅ All tests completed!")
}

main().catch((error) => {
  console.error("❌ Error:", error)
  process.exit(1)
})
