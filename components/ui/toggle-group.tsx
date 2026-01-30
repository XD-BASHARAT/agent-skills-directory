"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleGroupVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "gap-1",
        outline: "gap-1 rounded-md border p-1",
      },
      spacing: {
        0: "gap-0",
        1: "gap-1",
        2: "gap-2",
      },
    },
    defaultVariants: {
      variant: "default",
      spacing: 1,
    },
  }
)

const toggleGroupItemVariants = cva(
  "inline-flex items-center justify-center text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-md bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
        outline: "rounded-md border border-input bg-transparent hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:border-accent-foreground/20",
        pill: "rounded-full bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted data-[state=on]:bg-foreground data-[state=on]:text-background",
      },
      size: {
        default: "h-10 px-3",
        sm: "h-9 px-2.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ToggleGroupContextValue = {
  type: "single" | "multiple"
  value: string | string[] | undefined
  onValueChange?: (value: string | string[] | undefined) => void
  disabled?: boolean
  size?: "default" | "sm"
}

const ToggleGroupContext = React.createContext<ToggleGroupContextValue | null>(null)

function useToggleGroupContext() {
  const context = React.useContext(ToggleGroupContext)
  if (!context) {
    throw new Error("ToggleGroupItem must be used within ToggleGroup")
  }
  return context
}

type ToggleGroupProps = {
  type?: "single" | "multiple"
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[] | undefined) => void
  disabled?: boolean
  variant?: VariantProps<typeof toggleGroupVariants>["variant"]
  size?: "default" | "sm"
  spacing?: VariantProps<typeof toggleGroupVariants>["spacing"]
  orientation?: "horizontal" | "vertical"
  className?: string
  children: React.ReactNode
}

function ToggleGroup({
  type = "single",
  value: controlledValue,
  defaultValue,
  onValueChange,
  disabled = false,
  variant = "default",
  size = "default",
  spacing,
  orientation = "horizontal",
  className,
  children,
}: ToggleGroupProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | string[] | undefined>(
    defaultValue
  )

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue

  const handleValueChange = React.useCallback(
    (newValue: string | string[] | undefined) => {
      if (!isControlled) {
        setUncontrolledValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [isControlled, onValueChange]
  )

  const spacingValue = spacing ?? (variant === "outline" ? 0 : 1)

  const contextValue = React.useMemo<ToggleGroupContextValue>(
    () => ({
      type,
      value,
      onValueChange: handleValueChange,
      disabled,
      size,
    }),
    [type, value, handleValueChange, disabled, size]
  )

  return (
    <ToggleGroupContext.Provider value={contextValue}>
      <div
        data-slot="toggle-group"
        role="group"
        className={cn(
          !className?.includes("flex") && !className?.includes("grid") && toggleGroupVariants({ variant, spacing: spacingValue }),
          orientation === "vertical" && "flex-col",
          className
        )}
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  )
}

type ToggleGroupItemProps = {
  value: string
  disabled?: boolean
  variant?: VariantProps<typeof toggleGroupItemVariants>["variant"]
  size?: VariantProps<typeof toggleGroupItemVariants>["size"]
  className?: string
  children: React.ReactNode
  "aria-label"?: string
}

function ToggleGroupItem({
  value: itemValue,
  disabled = false,
  variant,
  size,
  className,
  children,
  "aria-label": ariaLabel,
  ...props
}: ToggleGroupItemProps) {
  const { type, value, onValueChange, disabled: groupDisabled, size: groupSize } = useToggleGroupContext()
  
  const finalVariant = variant ?? "default"
  const finalSize = size ?? groupSize ?? "default"

  const isDisabled = disabled || groupDisabled

  const isSelected = React.useMemo(() => {
    if (type === "single") {
      return value === itemValue
    }
    return Array.isArray(value) && value.includes(itemValue)
  }, [type, value, itemValue])

  const handleClick = React.useCallback(() => {
    if (isDisabled) return

    if (type === "single") {
      onValueChange?.(isSelected ? undefined : itemValue)
    } else {
      const currentValue = Array.isArray(value) ? value : []
      const newValue = isSelected
        ? currentValue.filter((v) => v !== itemValue)
        : [...currentValue, itemValue]
      onValueChange?.(newValue.length > 0 ? newValue : undefined)
    }
  }, [type, itemValue, isSelected, isDisabled, value, onValueChange])

  return (
    <button
      type="button"
      role="button"
      data-slot="toggle-group-item"
      data-state={isSelected ? "on" : "off"}
      aria-pressed={isSelected}
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(toggleGroupItemVariants({ variant: finalVariant, size: finalSize }), className)}
      {...props}
    >
      {children}
    </button>
  )
}

export { ToggleGroup, ToggleGroupItem }
