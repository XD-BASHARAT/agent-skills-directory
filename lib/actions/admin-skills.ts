"use server"

import { revalidatePath } from "next/cache"
import { eq, inArray } from "drizzle-orm"

import { checkAdminAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { skills, skillCategories } from "@/lib/db/schema"
import {
  approveSkill as dbApproveSkill,
  rejectSkill as dbRejectSkill,
  batchLinkSkillsToCategories,
} from "@/lib/db/queries"
import { skillUpdateSchema, type SkillUpdate } from "@/lib/validators/skills"

export type AdminSkillActionResult = {
  success: boolean
  error?: string
  message?: string
}

/**
 * Update skill metadata and status
 */
export async function updateSkill(
  skillId: string,
  updates: SkillUpdate,
  categories?: string[]
): Promise<AdminSkillActionResult> {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    const validation = skillUpdateSchema.safeParse(updates)
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid update data",
      }
    }

    const { name, description, status, isVerifiedOrg } = validation.data

    // Check if skill exists
    const existingSkill = await db
      .select({ id: skills.id })
      .from(skills)
      .where(eq(skills.id, skillId))
      .limit(1)

    if (existingSkill.length === 0) {
      return { success: false, error: "Skill not found" }
    }

    // Build update object
    const updateData: Partial<typeof skills.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (isVerifiedOrg !== undefined) updateData.isVerifiedOrg = isVerifiedOrg

    // Update skill
    await db.update(skills).set(updateData).where(eq(skills.id, skillId))

    // Update categories if provided
    if (categories !== undefined) {
      // Delete existing categories
      await db.delete(skillCategories).where(eq(skillCategories.skillId, skillId))

      // Add new categories
      if (categories.length > 0) {
        await batchLinkSkillsToCategories(
          categories.map((c) => ({ skillId, categoryIds: [c] }))
        )
      }
    }

    revalidatePath("/admin")
    revalidatePath(`/[owner]/skills/[name]`, "page")

    return {
      success: true,
      message: "Skill updated successfully",
    }
  } catch (error) {
    console.error("Failed to update skill:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update skill",
    }
  }
}

/**
 * Delete a skill
 */
export async function deleteSkill(skillId: string): Promise<AdminSkillActionResult> {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if skill exists
    const existingSkill = await db
      .select({ id: skills.id })
      .from(skills)
      .where(eq(skills.id, skillId))
      .limit(1)

    if (existingSkill.length === 0) {
      return { success: false, error: "Skill not found" }
    }

    // Delete skill (cascade will handle skillCategories)
    await db.delete(skills).where(eq(skills.id, skillId))

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/[owner]/skills/[name]`, "page")

    return {
      success: true,
      message: "Skill deleted successfully",
    }
  } catch (error) {
    console.error("Failed to delete skill:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete skill",
    }
  }
}

/**
 * Approve a skill
 */
export async function approveSkill(skillId: string): Promise<AdminSkillActionResult> {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if skill exists
    const existingSkill = await db
      .select({ id: skills.id, status: skills.status })
      .from(skills)
      .where(eq(skills.id, skillId))
      .limit(1)

    if (existingSkill.length === 0) {
      return { success: false, error: "Skill not found" }
    }

    if (existingSkill[0].status === "approved") {
      return { success: false, error: "Skill is already approved" }
    }

    await dbApproveSkill(skillId)

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/[owner]/skills/[name]`, "page")

    return {
      success: true,
      message: "Skill approved successfully",
    }
  } catch (error) {
    console.error("Failed to approve skill:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to approve skill",
    }
  }
}

/**
 * Reject a skill
 */
export async function rejectSkill(skillId: string): Promise<AdminSkillActionResult> {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if skill exists
    const existingSkill = await db
      .select({ id: skills.id, status: skills.status })
      .from(skills)
      .where(eq(skills.id, skillId))
      .limit(1)

    if (existingSkill.length === 0) {
      return { success: false, error: "Skill not found" }
    }

    if (existingSkill[0].status === "rejected") {
      return { success: false, error: "Skill is already rejected" }
    }

    await dbRejectSkill(skillId)

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/[owner]/skills/[name]`, "page")

    return {
      success: true,
      message: "Skill rejected successfully",
    }
  } catch (error) {
    console.error("Failed to reject skill:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reject skill",
    }
  }
}

/**
 * Bulk approve skills
 */
export async function bulkApproveSkills(
  skillIds: string[]
): Promise<AdminSkillActionResult & { approved?: number }> {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    if (!Array.isArray(skillIds) || skillIds.length === 0) {
      return { success: false, error: "Invalid skill IDs" }
    }

    // Check which skills exist and are pending
    const existingSkills = await db
      .select({ id: skills.id, status: skills.status })
      .from(skills)
      .where(inArray(skills.id, skillIds))

    const pendingSkills = existingSkills.filter((s) => s.status === "pending")
    const pendingIds = pendingSkills.map((s) => s.id)

    if (pendingIds.length === 0) {
      return { success: false, error: "No pending skills to approve" }
    }

    // Approve all pending skills
    await Promise.all(pendingIds.map((id) => dbApproveSkill(id)))

    revalidatePath("/admin")
    revalidatePath("/")

    return {
      success: true,
      message: `${pendingIds.length} skill(s) approved successfully`,
      approved: pendingIds.length,
    }
  } catch (error) {
    console.error("Failed to bulk approve skills:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk approve skills",
    }
  }
}

/**
 * Bulk reject skills
 */
export async function bulkRejectSkills(
  skillIds: string[]
): Promise<AdminSkillActionResult & { rejected?: number }> {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    if (!Array.isArray(skillIds) || skillIds.length === 0) {
      return { success: false, error: "Invalid skill IDs" }
    }

    // Check which skills exist and are pending
    const existingSkills = await db
      .select({ id: skills.id, status: skills.status })
      .from(skills)
      .where(inArray(skills.id, skillIds))

    const pendingSkills = existingSkills.filter((s) => s.status === "pending")
    const pendingIds = pendingSkills.map((s) => s.id)

    if (pendingIds.length === 0) {
      return { success: false, error: "No pending skills to reject" }
    }

    // Reject all pending skills
    await Promise.all(pendingIds.map((id) => dbRejectSkill(id)))

    revalidatePath("/admin")
    revalidatePath("/")

    return {
      success: true,
      message: `${pendingIds.length} skill(s) rejected successfully`,
      rejected: pendingIds.length,
    }
  } catch (error) {
    console.error("Failed to bulk reject skills:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk reject skills",
    }
  }
}

/**
 * Bulk delete skills
 */
export async function bulkDeleteSkills(
  skillIds: string[]
): Promise<AdminSkillActionResult & { deleted?: number }> {
  try {
    const isAdmin = await checkAdminAuth()
    if (!isAdmin) {
      return { success: false, error: "Unauthorized" }
    }

    if (!Array.isArray(skillIds) || skillIds.length === 0) {
      return { success: false, error: "Invalid skill IDs" }
    }

    // Check which skills exist
    const existingSkills = await db
      .select({ id: skills.id })
      .from(skills)
      .where(inArray(skills.id, skillIds))

    const existingIds = existingSkills.map((s) => s.id)

    if (existingIds.length === 0) {
      return { success: false, error: "No skills found to delete" }
    }

    // Delete all skills (cascade will handle skillCategories)
    await db.delete(skills).where(inArray(skills.id, existingIds))

    revalidatePath("/admin")
    revalidatePath("/")
    revalidatePath(`/[owner]/skills/[name]`, "page")

    return {
      success: true,
      message: `${existingIds.length} skill(s) deleted successfully`,
      deleted: existingIds.length,
    }
  } catch (error) {
    console.error("Failed to bulk delete skills:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk delete skills",
    }
  }
}
