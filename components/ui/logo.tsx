import { BRAND } from "@/config/site";
import Link from "next/link";
import { LogoMark } from "@/components/ui/logo-mark";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
  tone?: "dark" | "light";
  size?: "md" | "lg";
}

export function Logo({ className, href = "/", tone = "dark", size = "md" }: LogoProps) {
  const large = size === "lg";

  return (
    <Link href={href} aria-label={`${BRAND.name} home`} className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark className={large ? "size-12" : "size-9"} />
      <span className={cn("font-inter font-semibold tracking-[-0.035em]", large ? "text-3xl" : "text-[19px]", tone === "dark" ? "text-ink" : "text-white")}>
        {BRAND.prefix}
      </span>
    </Link>
  );
}
