import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/": "Home",
  "/brand": "Brand Assets",
  "/generate": "Generate",
  "/approval": "Approval",
  "/dashboard": "Dashboard",
  "/integrations": "Integrations",
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background bg-grid">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border px-4 glass-strong sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            {title && (
              <span className="text-sm font-display font-semibold text-foreground">{title}</span>
            )}
          </header>
          <main className="flex-1 overflow-auto bg-radial-glow">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
