"use client"

import * as React from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SkillsTable, type Skill } from "./skills-table"
import { SkillEditDialog } from "./skill-edit-dialog"
import {
  approveSkill,
  rejectSkill,
  deleteSkill,
  updateSkill,
} from "@/lib/actions/admin-skills"

type SkillFilter = "all" | "pending" | "approved" | "rejected"

type SkillsTabProps = {
  skills: Skill[]
}

export const SkillsTab = React.memo(function SkillsTab({ skills: initialSkills }: SkillsTabProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const normalizeFilter = React.useCallback((value: string | null): SkillFilter => {
    if (value === "pending" || value === "approved" || value === "rejected") {
      return value
    }
    return "all"
  }, [])

  const [skillFilter, setSkillFilter] = React.useState<SkillFilter>(
    normalizeFilter(searchParams.get("status"))
  )
  const [editingSkill, setEditingSkill] = React.useState<Skill | null>(null)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [skills, setSkills] = React.useState<Skill[]>(initialSkills)

  // Sync skills with initialSkills when it changes
  React.useEffect(() => {
    setSkills(initialSkills)
  }, [initialSkills])

  React.useEffect(() => {
    setSkillFilter(normalizeFilter(searchParams.get("status")))
  }, [normalizeFilter, searchParams])

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (skillFilter === "all") {
      params.delete("status")
    } else {
      params.set("status", skillFilter)
    }
    const next = params.toString()
    const current = searchParams.toString()
    if (next !== current) {
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false })
    }
  }, [pathname, router, searchParams, skillFilter])

  const openEditDialog = React.useCallback((skill: Skill) => {
    setEditingSkill(skill)
    setIsEditOpen(true)
  }, [])

  const handleApprove = React.useCallback(async (skillId: string) => {
    const result = await approveSkill(skillId)
    if (result.success) {
      toast.success(result.message ?? "Skill approved successfully")
      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? { ...s, status: "approved" } : s))
      )
    } else {
      toast.error(result.error ?? "Failed to approve skill")
      throw new Error(result.error ?? "Failed to approve skill")
    }
  }, [])

  const handleReject = React.useCallback(async (skillId: string) => {
    const result = await rejectSkill(skillId)
    if (result.success) {
      toast.success(result.message ?? "Skill rejected successfully")
      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? { ...s, status: "rejected" } : s))
      )
    } else {
      toast.error(result.error ?? "Failed to reject skill")
      throw new Error(result.error ?? "Failed to reject skill")
    }
  }, [])

  const handleDelete = React.useCallback(async (skillId: string) => {
    const result = await deleteSkill(skillId)
    if (result.success) {
      toast.success(result.message ?? "Skill deleted successfully")
      setSkills((prev) => prev.filter((s) => s.id !== skillId))
    } else {
      toast.error(result.error ?? "Failed to delete skill")
      throw new Error(result.error ?? "Failed to delete skill")
    }
  }, [])

  const handleUpdate = React.useCallback(
    async (skillId: string, updates: Partial<Skill>, categories?: string[]) => {
      const result = await updateSkill(skillId, updates as any, categories)
      if (result.success) {
        toast.success(result.message ?? "Skill updated successfully")
        setSkills((prev) =>
          prev.map((s) => (s.id === skillId ? { ...s, ...updates } : s))
        )
      } else {
        toast.error(result.error ?? "Failed to update skill")
        throw new Error(result.error ?? "Failed to update skill")
      }
    },
    []
  )

  const filteredSkills = React.useMemo(() => {
    if (skillFilter === "all") return skills
    return skills.filter((s) => s.status === skillFilter)
  }, [skills, skillFilter])

  const skillStatusCounts = React.useMemo(
    () => ({
      all: skills.length,
      pending: skills.filter((s) => s.status === "pending").length,
      approved: skills.filter((s) => s.status === "approved").length,
      rejected: skills.filter((s) => s.status === "rejected").length,
    }),
    [skills]
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills Management</CardTitle>
          <CardDescription>Manage published skills.</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 pb-4">
            {(["all", "pending", "approved", "rejected"] as const).map((status) => (
              <Button
                key={status}
                type="button"
                variant={skillFilter === status ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSkillFilter(status)}
                className="capitalize"
              >
                {status} ({skillStatusCounts[status]})
              </Button>
            ))}
          </div>

          <SkillsTable
            skills={filteredSkills}
            onEdit={openEditDialog}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <SkillEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        skill={editingSkill}
        onSave={handleUpdate}
      />
    </div>
  )
})
