import { LayoutDashboard, FileText, Users, MapPin, Settings, LogOut, Brush, BookOpen, Award, User, Calendar, Monitor, BarChart3, Mic2, Star, Bus } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const allItems = [
  { id: "dashboard", title: "Dashboard", url: "/", icon: LayoutDashboard },
  { id: "reports", title: "Relatórios", url: "/reports", icon: FileText },
  { id: "groups", title: "Grupos", url: "/groups", icon: Users },
  { id: "publishers", title: "Publicadores", url: "/publishers", icon: User },
  { id: "pioneers", title: "Pioneiros", url: "/pioneers", icon: Star },
  { id: "meetings", title: "Reuniões", url: "/meetings", icon: Calendar },
  { id: "speeches", title: "Discursos", url: "/speeches", icon: Mic2 },
  { id: "attendance", title: "Assistência", url: "/attendance", icon: BarChart3 },
  { id: "audio-video", title: "Áudio e Vídeo", url: "/audio-video", icon: Monitor },
  { id: "cleaning", title: "Limpeza", url: "/cleaning", icon: Brush },
  { id: "designations", title: "Designações", url: "/designations", icon: Award },
  { id: "school", title: "Escola", url: "/school", icon: BookOpen },
  { id: "territories", title: "Territórios", url: "/territories", icon: MapPin },
  { id: "transport", title: "Transporte", url: "/transport", icon: Bus },
  { id: "users", title: "Gerenciar Usuários", url: "/users", icon: Settings },
  { id: "settings", title: "Configurações", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  userProfile?: any;
}

export function AppSidebar({ userProfile }: AppSidebarProps) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const collapsed = state === "collapsed" && !isMobile;

  // No celular, fecha o menu (Sheet) ao navegar ou sair.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleLogout = async () => {
    closeOnMobile();
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Erro ao sair");
    else navigate("/auth");
  };

  const filteredItems = allItems.filter(item => {
    if (userProfile?.role === 'admin') return true;
    return userProfile?.permissions?.[item.id];
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 pt-[calc(1rem+env(safe-area-inset-top))] border-b border-sidebar-border">
          {!collapsed && <h2 className="text-xl font-bold text-sidebar-foreground">Congregação</h2>}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink to={item.url} end={item.url === "/"} onClick={closeOnMobile} className={({ isActive }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}>
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
          <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/50">
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && <span>Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}