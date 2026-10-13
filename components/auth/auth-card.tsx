import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function AuthCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Card className={cn("w-full max-w-[500px] gap-0 overflow-visible rounded-[28px] border border-black/[0.06] bg-white py-0 shadow-[0_30px_70px_-45px_rgba(30,20,10,0.35)] ring-0", className)}>
      <CardContent className="p-8 sm:p-9">{children}</CardContent>
    </Card>
  );
}

export function AuthHeading({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-6">
      <h1 className="font-inter text-[30px] leading-tight font-semibold tracking-[-0.04em] text-ink">{title}</h1>
      {description ? <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p> : null}
    </div>
  );
}
