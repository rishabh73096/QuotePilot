import { cn } from "@/lib/utils";

// QuotePilot mark: a "Q" ring whose tail is an orange pointer, on an ink tile. Same drawing as app/icon.svg.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={cn("size-10 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105", className)}>
      <rect width="40" height="40" rx="11" fill="#17120e" />
      <circle cx="19" cy="19" r="8.5" fill="none" stroke="#fff" strokeWidth="3" />
      <path d="M23.8 23.8 30 30" stroke="#ff7a2f" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}
