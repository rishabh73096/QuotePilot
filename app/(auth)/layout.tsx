import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { AuthPanel } from "@/components/auth/hero/auth-panel";
import { Logo } from "@/components/ui/logo";
import { authHeroData } from "@/data/auth";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-svh bg-[#fcfaf7] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(480px,1fr)]">
        <AuthPanel content={authHeroData} />
        <main className="relative flex flex-col items-center justify-center px-4 pt-24 pb-12 lg:py-12">
          <div className="absolute top-5 left-16 lg:hidden"><Logo /></div>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
