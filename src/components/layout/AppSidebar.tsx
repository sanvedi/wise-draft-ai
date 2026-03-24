import { Home, Palette, PenTool, CheckSquare, BarChart3, Sparkles, Plug } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Brand Assets", url: "/brand", icon: Palette },
  { title: "Generate", url: "/generate", icon: PenTool },
  { title: "Approval", url: "/approval", icon: CheckSquare },
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Integrations", url: "/integrations", icon: Plug },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10 glow-primary flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-display font-bold text-foreground tracking-tight whitespace-nowrap">
              Sutra <span className="text-gradient">Pravartak</span>
            </h1>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">GenAI Content Engine</p>
          </div>
        )}
      </div>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                          isActive ? "glass glow-primary text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                        activeClassName=""
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {!collapsed && (
        <div className="mt-auto p-4">
          <div className="glass rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[9px] font-mono text-primary uppercase tracking-wider">System Online</span>
            </div>
            <p className="text-[9px] text-muted-foreground font-mono">5 Agents Ready</p>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
