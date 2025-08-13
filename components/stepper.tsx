"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const Stepper = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
  }
>(({ value = 0, className, children, ...props }, ref) => {
  const steps = React.Children.toArray(children)
  const stepCount = steps.length

  return (
    <div ref={ref} className={cn("flex w-full flex-row justify-between", className)} {...props}>
      {steps.map((step, index) => {
        const isActive = index === value
        const isCompleted = index < value

        return (
          <div
            key={index}
            data-state={isActive ? "active" : isCompleted ? "completed" : "inactive"}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center",
              index !== stepCount - 1 &&
                "after:absolute after:left-1/2 after:top-[calc(theme(spacing[7])/2+theme(spacing[0.5]))] after:h-[1px] after:w-full after:bg-muted-foreground/20",
            )}
          >
            <div
              className={cn(
                "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/20 bg-background text-muted-foreground",
              )}
            >
              {isCompleted ? <CheckIcon className="h-3 w-3" /> : index + 1}
            </div>
            {step}
          </div>
        )
      })}
    </div>
  )
})
Stepper.displayName = "Stepper"

const Step = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-2 flex w-full flex-col items-center justify-center text-center", className)}
    {...props}
  />
))
Step.displayName = "Step"

const StepTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm font-medium", className)} {...props} />,
)
StepTitle.displayName = "StepTitle"

const StepDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
  ),
)
StepDescription.displayName = "StepDescription"

export { Stepper, Step, StepTitle, StepDescription }

