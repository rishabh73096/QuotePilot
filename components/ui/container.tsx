import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const CONTAINER = "mx-auto w-full max-w-7xl px-4 md:px-8";

export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(CONTAINER, className)} {...props} />;
}
