import React from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: LayoutProps) {
  return (
    <aside className={cn("w-72 bg-card border-r border-white/5 flex flex-col overflow-y-auto", className)}>
      {children}
    </aside>
  );
}

export function MainContent({ children, className }: LayoutProps) {
  return (
    <main className={cn("flex-1 bg-background flex flex-col overflow-hidden relative z-0", className)}>
      {children}
    </main>
  );
}

export function RightPanel({ children, className }: LayoutProps) {
  return (
    <aside className={cn("w-[400px] bg-card border-l border-white/5 flex flex-col overflow-y-auto", className)}>
      {children}
    </aside>
  );
}
