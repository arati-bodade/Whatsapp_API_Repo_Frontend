"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> & { value?: number | null }
>(({ className, value, ...props }, ref) => (
    <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value || 0}
        data-slot="progress"
        className={cn(
            "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
            className
        )}
        {...props}
    >
        <div
            data-slot="progress-indicator"
            className="bg-primary h-full w-full flex-1 transition-all"
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </div>
))
Progress.displayName = "Progress"

export { Progress }
