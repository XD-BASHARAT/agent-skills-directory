import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionProps extends React.ComponentProps<"section"> {
  spacing?: "none" | "sm" | "md" | "lg" | "xl"
}

const spacingClasses = {
  none: "",
  sm: "py-4",
  md: "py-6", 
  lg: "py-8",
  xl: "py-12",
}

function Section({
  spacing = "md",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
}

export { Section }