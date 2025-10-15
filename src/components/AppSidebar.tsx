import { LayoutDashboard, FileText, Users, MapPin, Settings, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Relatórios", url: "/reports", icon: FileText },
  { title: "Designações", url: "/designations", icon: Users },
  { title: "Territórios", url: "/territories", icon: MapPin },
  { title: "Usuários", url: "/users", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Erro ao sair", description: error.message, variant: "destructive" });
    } else {
      navigate("/auth");
    }
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed && (
            <h2 className="text-xl font-bold text-sidebar-foreground">Congregação</h2>
          )}
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
