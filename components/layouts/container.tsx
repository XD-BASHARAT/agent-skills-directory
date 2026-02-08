import * as React from "react"
import { cn } from "@/lib/utils"

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full"

const containerSizes: Record<ContainerSize, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  full: "max-w-5xl",
}

interface ContainerProps extends React.ComponentProps<"div"> {
  size?: ContainerSize
  spacing?: "none" | "sm" | "md" | "lg"
}

const spacingClasses = {
  none: "",
  sm: "space-y-3",
  md: "space-y-4", 
  lg: "space-y-6",
}

function Container({
  size = "full",
  spacing = "md",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        "px-4 py-6 sm:px-6",
        containerSizes[size],
        spacingClasses[spacing],
        className
      )}
      data-slot="container"
      data-size={size}
      {...props}
    >
      {children}
    </div>
  )
}

export { Container, type ContainerSize }
