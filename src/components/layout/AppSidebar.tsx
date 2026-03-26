import { Home, Palette, PenTool, CheckSquare, BarChart3, Plug, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
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
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <div className="p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-display font-bold text-sm">CF</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-display font-bold text-foreground tracking-tight whitespace-nowrap">
              Content <span className="text-gradient">Flow</span>
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">From creation to distribution—on autopilot.</p>
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
                          isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
          {user && (
            <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-muted-foreground truncate flex-1">{user.email}</span>
              <button onClick={signOut} className="text-muted-foreground hover:text-destructive transition-colors p-1" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </Sidebar>
  );
}
