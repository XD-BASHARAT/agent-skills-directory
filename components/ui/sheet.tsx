"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Sheet = Dialog.Root

const SheetTrigger = Dialog.Trigger

const SheetClose = Dialog.Close

const SheetPortal = Dialog.Portal

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Backdrop>) {
  return (
    <Dialog.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/80 backdrop-blur-sm",
        "data-open:animate-in data-closed:animate-out",
        "data-closed:fade-out-0 data-open:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

type SheetContentProps = React.ComponentProps<typeof Dialog.Popup> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}

function SheetContent({
  side = "right",
  showCloseButton = true,
  className,
  children,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <Dialog.Popup
        className={cn(
          "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
          "data-open:animate-in data-closed:animate-out data-closed:duration-300 data-open:duration-500",
          {
            "inset-x-0 top-0 border-b data-closed:slide-out-to-top data-open:slide-in-from-top":
              side === "top",
            "inset-y-0 right-0 h-full w-3/4 border-l data-closed:slide-out-to-right data-open:slide-in-from-right sm:max-w-sm":
              side === "right",
            "inset-x-0 bottom-0 border-t data-closed:slide-out-to-bottom data-open:slide-in-from-bottom":
              side === "bottom",
            "inset-y-0 left-0 h-full w-3/4 border-r data-closed:slide-out-to-left data-open:slide-in-from-left sm:max-w-sm":
              side === "left",
          },
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Dialog.Close
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-open:bg-accent data-open:text-muted-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </Dialog.Close>
        )}
      </Dialog.Popup>
    </SheetPortal>
  )
}

function SheetHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}

function SheetFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  )
}

const SheetTitle = Dialog.Title

const SheetDescription = Dialog.Description

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
