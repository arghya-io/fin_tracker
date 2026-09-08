import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { FloatingAddButton } from "./FloatingAddButton";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import { useLastSeenHeartbeat } from "@/hooks/useLastSeenHeartbeat";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useLastSeenHeartbeat();

  return (
    <SidebarProvider>
      <NotificationPermissionPrompt />
      <div className="flex w-full" style={{ minHeight: "100dvh" }}>
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col" style={{ minHeight: "100dvh" }}>
          {/* Desktop-only top bar. On mobile each page renders its own header,
              so top safe-area padding is applied directly on <main> instead. */}
          <header className="h-0 hidden md:flex md:h-12 items-center border-b border-border px-4 md:px-6">
            <SidebarTrigger />
          </header>
          <main
            className="flex-1 px-4 md:px-6 overflow-auto"
            style={{
              paddingTop: "max(1rem, calc(env(safe-area-inset-top, 0px) + 0.75rem))",
              paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 16px)",
            }}
          >
            {children}
          </main>
        </div>
        <MobileBottomNav />
        <FloatingAddButton />
      </div>
    </SidebarProvider>
  );
}
