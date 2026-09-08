import { ReactNode } from "react";
import { Link } from "react-router-dom";

export function SplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background" style={{ minHeight: "100dvh" }}>
      <header
        className="border-b border-border px-4 flex items-center gap-2"
        style={{
          paddingTop: "max(0.75rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))",
          paddingBottom: "0.75rem",
        }}
      >
        <img
          src="/media/fintrack-split-logo.png"
          alt="FinTrack Split"
          className="h-8 w-auto object-contain"
        />
        <div className="flex-1" />
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
          ← Back to FinTrack
        </Link>
      </header>
      <main className="max-w-2xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
