import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { FloatingAddButton } from "./FloatingAddButton";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-0 hidden md:flex md:h-12 items-center border-b border-border px-4 md:px-6">
            <SidebarTrigger />
          </header>
          <main
            className="flex-1 p-4 md:p-6 overflow-auto"
            style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 16px)" }}
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
