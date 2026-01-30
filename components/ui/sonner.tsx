"use client"

import * as React from "react"
import { Toaster as Sonner } from "sonner"

import { cn } from "@/lib/utils"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ className, ...props }: ToasterProps) {
  return (
    <Sonner
      closeButton
      duration={2600}
      position="top-right"
      className={cn("toaster group", className)}
      toastOptions={{
        classNames: {
          toast: "group toast bg-popover text-popover-foreground border border-border/60 shadow-md",
          title: "text-sm font-medium",
          description: "text-xs text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground hover:bg-primary/90",
          cancelButton: "bg-muted text-muted-foreground hover:text-foreground",
          closeButton: "text-muted-foreground hover:text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
