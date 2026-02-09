"use client"

import * as React from "react"
import { Flag } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "malicious", label: "Malicious content" },
  { value: "copyright", label: "Copyright violation" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "broken", label: "Broken / Not working" },
  { value: "other", label: "Other" },
] as const

type ReportReason = (typeof REPORT_REASONS)[number]["value"]

interface ReportSkillDialogProps {
  skillId: string
  skillName: string
}

function ReportSkillDialog({ skillId, skillName }: ReportSkillDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [reason, setReason] = React.useState<ReportReason | null>(null)
  const [description, setDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/skills/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillId,
          reason,
          description: description.trim() || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit report")
      }

      toast.success("Report submitted successfully")
      setOpen(false)
      setReason(null)
      setDescription("")
    } catch {
      toast.error("Failed to submit report. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
          <Flag className="size-3.5" aria-hidden="true" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Skill</DialogTitle>
          <DialogDescription>
            Report an issue with <span className="font-medium">{skillName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label id="report-reason-label" className="text-sm font-medium">Reason</label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="report-reason-label">
              {REPORT_REASONS.map((r, index) => (
                <button
                  key={r.value}
                  ref={(el) => {
                    buttonRefs.current[index] = el
                  }}
                  type="button"
                  onClick={() => setReason(r.value)}
                  role="radio"
                  aria-checked={reason === r.value}
                  tabIndex={reason === r.value || (reason === null && index === 0) ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setReason(r.value)
                    }

                    // Arrow key navigation
                    let nextIndex = -1
                    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                      nextIndex = (index + 1) % REPORT_REASONS.length
                    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                      nextIndex = (index - 1 + REPORT_REASONS.length) % REPORT_REASONS.length
                    }

                    if (nextIndex !== -1) {
                      e.preventDefault()
                      buttonRefs.current[nextIndex]?.focus()
                    }
                  }}
                  className={cn(
                    "rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    reason === r.value
                      ? "border-primary bg-primary/10 text-foreground"
                    : "border-border hover:bg-muted"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="report-details" className="text-sm font-medium">
              Additional details <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id="report-details"
              name="details"
              autoComplete="off"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about the issue…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason || isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ReportSkillDialog }
