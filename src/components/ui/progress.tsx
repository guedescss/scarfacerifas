"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<"div"> & { value?: number }) {
  const progress = Math.min(100, Math.max(0, value ?? 0));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
    </div>
  );
}

export { Progress };
