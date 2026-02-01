"use client"

import * as React from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { pingIndexNow } from "@/lib/actions/admin"
import type { Skill } from "./skills-table"

type OverviewTabProps = {
  skills: Skill[]
  stats: {
    total: number
    approved: number
    pending: number
    rejected: number
  }
}

export const OverviewTab = React.memo(function OverviewTab({ stats }: OverviewTabProps) {
  const [pinging, setPinging] = React.useState(false)

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Skills" value={stats.total} />
        <StatCard label="Approved Skills" value={stats.approved} color="green" />
        <StatCard label="Pending Skills" value={stats.pending} color="yellow" />
        <StatCard label="Rejected Skills" value={stats.rejected} color="red" />
      </div>
    </div>
  )
})

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
    red: "text-red-600",
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
