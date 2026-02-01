"use client"

import * as React from "react"
import { useUser, UserButton } from "@clerk/nextjs"
import { Check, ExternalLink, Loader2, SquarePen, Trash2, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CATEGORIES, type CategoryDefinition } from "@/lib/categories"
import { cn, getExternalUrl } from "@/lib/utils"
import type { SkillUpdate } from "@/lib/validators/skills"

import { updateSkill, deleteSkill, approveSkill, rejectSkill } from "@/lib/actions/skills"
import { pingIndexNow } from "@/lib/actions/admin"

type Tab = "overview" | "skills"

type Stats = {
  totalSkills: number
  approvedSkills: number
  pendingSkills: number
}

// Re-using types matching DB/Schema roughly, but simpler for UI
type Skill = {
  id: string
  name: string
  description: string
  owner: string
  repo: string
  path: string
  url: string
  stars: number | null
  status: string | null
  isVerifiedOrg?: boolean | null
  // featured is removed as it's not in DB
}

type AdminClientPageProps = {
  initialSkills: Skill[]
}

export default function AdminClientPage({ initialSkills }: AdminClientPageProps) {
  const { isLoaded, user } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const normalizeTab = React.useCallback((value: string | null): Tab => {
    if (value === "skills") return "skills"
    return "overview"
  }, [])

  const [activeTab, setActiveTab] = React.useState<Tab>(
    normalizeTab(searchParams.get("tab"))
  )

  React.useEffect(() => {
    setActiveTab(normalizeTab(searchParams.get("tab")))
  }, [normalizeTab, searchParams])

  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (activeTab === "overview") {
      params.delete("tab")
    } else {
      params.set("tab", activeTab)
    }
    const next = params.toString()
    const current = searchParams.toString()
    if (next !== current) {
      router.replace(`${pathname}${next ? `?${next}` : ""}`, { scroll: false })
    }
  }, [activeTab, pathname, router, searchParams])

  if (!isLoaded) {
    return <div className="p-12 text-center">Loading…</div>
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Admin Dashboard</CardTitle>
              <CardDescription>
                Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </CardDescription>
            </div>
            <CardAction>
              <UserButton afterSignOutUrl="/" />
            </CardAction>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {(["overview", "skills"] as Tab[]).map((tab) => (
              <Button
                key={tab}
                type="button"
                variant={activeTab === tab ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="capitalize"
              >
                {tab}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeTab === "overview" && <OverviewTab skills={initialSkills} />}
      {activeTab === "skills" && <SkillsTab skills={initialSkills} />}
    </div>
  )
}

function OverviewTab({ skills }: { skills: Skill[] }) {
  const [pinging, setPinging] = React.useState(false)

  const stats: Stats = React.useMemo(() => ({
    totalSkills: skills.length,
    approvedSkills: skills.filter((s) => s.status === "approved").length,
    pendingSkills: skills.filter((s) => s.status === "pending").length,
  }), [skills])

  const handlePingIndexNow = async () => {
    if (pinging) return
    setPinging(true)
    try {
      const res = await pingIndexNow()
      if (res.success) {
        toast.success(`IndexNow Ping Successful! Submitted ${res.count} URLs.`)
      } else {
        toast.error(`Failed: ${res.message}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error calling IndexNow")
    } finally {
      setPinging(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Dashboard Overview</h3>
        <Button onClick={handlePingIndexNow} disabled={pinging} size="sm">
          {pinging ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Pinging…
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" /> Ping IndexNow
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Skills" value={stats.totalSkills} />
        <StatCard label="Approved Skills" value={stats.approvedSkills} color="green" />
        <StatCard label="Pending Skills" value={stats.pendingSkills} color="yellow" />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color?: string
}) {
  const colorClass = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    blue: "text-blue-600",
    orange: "text-orange-600",
  }[color ?? ""] ?? ""

  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      </CardContent>
    </Card>
  )
}

type SkillFilter = "all" | "pending" | "approved" | "rejected"

function SkillsTab({ skills }: { skills: Skill[] }) {
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

  const handleSkillAction = React.useCallback(
    async (skillId: string, action: "approve" | "reject" | "delete") => {
      if (action === "delete" && !confirm("Delete this skill?")) return

      try {
        if (action === "approve") await approveSkill(skillId)
        else if (action === "reject") await rejectSkill(skillId)
        else if (action === "delete") await deleteSkill(skillId)

        toast.success(`Skill ${action}d successfully`)
      } catch {
        toast.error(`Failed to ${action} skill`)
      }
    },
    []
  )

  const handleSkillUpdate = React.useCallback(
    async (skillId: string, updates: Partial<Skill>, categories?: string[]) => {
      try {
        await updateSkill(skillId, {
          name: updates.name,
          description: updates.description,
          status: updates.status as SkillUpdate['status'],
          isVerifiedOrg: updates.isVerifiedOrg as boolean | undefined
        }, categories)
        toast.success("Skill updated successfully")
      } catch {
        toast.error("Failed to update skill")
      }
    },
    []
  )

  const skillColumns: ColumnDef<Skill>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
              {row.original.description}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "owner",
        header: "Repo",
        cell: ({ row }) => (
          <a
            href={getExternalUrl(`https://github.com/${row.original.owner}/${row.original.repo}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm hover:underline"
          >
            {row.original.owner}/{row.original.repo}
            <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
          </a>
        ),
      },
      {
        accessorKey: "stars",
        header: "Stars",
        cell: ({ row }) => <span>Star {row.original.stars}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status
          const colorClass =
            status === "approved"
              ? "text-green-600 bg-green-50"
              : status === "rejected"
                ? "text-red-600 bg-red-50"
                : "text-yellow-600 bg-yellow-50"
          return (
            <span className={`px-2 py-0.5 text-xs rounded-full ${colorClass}`}>
              {status}
            </span>
          )
        },
        filterFn: (row, id, value) => {
          if (value === "all") return true
          return row.getValue(id) === value
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const skill = row.original
          return (
            <div className="flex items-center gap-1">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Edit skill"
                onClick={() => openEditDialog(skill)}
              >
                <SquarePen className="size-3.5" aria-hidden="true" />
              </Button>
              {skill.status === "pending" && (
                <Button
                  size="icon-sm"
                  aria-label="Approve skill"
                  onClick={() => handleSkillAction(skill.id, "approve")}
                >
                  <Check className="size-3.5" aria-hidden="true" />
                </Button>
              )}
              {skill.status === "pending" && (
                <Button
                  size="icon-sm"
                  variant="outline"
                  aria-label="Reject skill"
                  onClick={() => handleSkillAction(skill.id, "reject")}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </Button>
              )}
              <Button
                size="icon-sm"
                variant="outline"
                aria-label="Delete skill"
                onClick={() => handleSkillAction(skill.id, "delete")}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          )
        },
      },
    ],
    [handleSkillAction, openEditDialog]
  )

  const filteredSkills = React.useMemo(() => {
    if (skillFilter === "all") return skills
    return skills.filter((s) => s.status === skillFilter)
  }, [skills, skillFilter])

  const skillStatusCounts = React.useMemo(() => ({
    all: skills.length,
    pending: skills.filter((s) => s.status === "pending").length,
    approved: skills.filter((s) => s.status === "approved").length,
    rejected: skills.filter((s) => s.status === "rejected").length,
  }), [skills])

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

          <DataTable
            columns={skillColumns}
            data={filteredSkills}
            searchKey="name"
            searchPlaceholder="Search skills…"
            pageSize={20}
          />
        </CardContent>
      </Card>

      <SkillEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        skill={editingSkill}
        onSave={handleSkillUpdate}
      />
    </div>
  )
}

type SkillEditDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill: Skill | null
  onSave: (skillId: string, updates: Partial<Skill>, categories?: string[]) => Promise<void>
}

function SkillEditDialog({
  open,
  onOpenChange,
  skill,
  onSave,
}: SkillEditDialogProps) {
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [status, setStatus] = React.useState<SkillFilter>("pending")
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>([])
  const [initialCategories, setInitialCategories] = React.useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!skill || !open) return
    setName(skill.name ?? "")
    setDescription(skill.description ?? "")
    setStatus((skill.status as SkillFilter) ?? "pending")
    setError(null)
    setSelectedCategories([])
    setInitialCategories([])

    const controller = new AbortController()
    const fetchCategories = async () => {
      setLoadingCategories(true)
      try {
        const res = await fetch(
          `/api/admin/skills/${encodeURIComponent(skill.id)}/categories`,
          { signal: controller.signal }
        )
        if (res.ok) {
          const data = await res.json()
          setSelectedCategories(data.categories ?? [])
          setInitialCategories(data.categories ?? [])
        } else {
          setError("Failed to load categories")
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        console.error("Failed to fetch categories", err)
        setError("Failed to load categories")
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
    return () => controller.abort()
  }, [skill, open])

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const handleSave = async () => {
    if (!skill) return
    setIsSaving(true)
    setError(null)

    const updates: Partial<Skill> = {}
    if (name.trim() && name.trim() !== skill.name) updates.name = name.trim()
    if (description.trim() !== skill.description) updates.description = description.trim()
    if (status !== skill.status) updates.status = status

    const categoriesChanged =
      selectedCategories.length !== initialCategories.length ||
      selectedCategories.some((s) => !initialCategories.includes(s))

    try {
      await onSave(
        skill.id,
        updates,
        categoriesChanged ? selectedCategories : undefined
      )
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skill")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/70 bg-card p-5 shadow-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Edit Skill</DialogTitle>
          <DialogDescription>
            Update metadata, status, and categories for this skill.
          </DialogDescription>
        </DialogHeader>
        {!skill ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No skill selected.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{skill.owner}/{skill.repo}</span>
                <a
                  href={getExternalUrl(skill.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Open GitHub
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </div>
              <div className="mt-1 truncate">Path: {skill.path}</div>
            </div>

            <div className="space-y-2">
              <label htmlFor="skill-name" className="text-xs font-medium text-muted-foreground">Name</label>
              <Input id="skill-name" name="name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label htmlFor="skill-description" className="text-xs font-medium text-muted-foreground">Description</label>
              <Textarea
                id="skill-description"
                name="description"
                autoComplete="off"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-24"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="skill-status" className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={status} onValueChange={(value) => setStatus(value as SkillFilter)}>
                <SelectTrigger id="skill-status" className="w-full" size="default">
                  <SelectValue placeholder="Select status…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Categories</label>
              {loadingCategories ? (
                <div className="text-xs text-muted-foreground">Loading categories…</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {(CATEGORIES as readonly CategoryDefinition[]).map((category) => {
                    const isSelected = selectedCategories.includes(category.slug)
                    return (
                      <label
                        key={category.id}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition-colors",
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCategory(category.slug)}
                        />
                        <span className="text-sm">
                          {category.name}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {selectedCategories.map((slug) => {
                    const cat = (CATEGORIES as readonly CategoryDefinition[]).find((c) => c.slug === slug)
                    return cat ? (
                      <Badge key={slug} variant="secondary" className="text-xs">
                        {cat.icon} {cat.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              )}
            </div>

            {error && <div className="text-xs text-destructive">{error}</div>}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving || !skill}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


