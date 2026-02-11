import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) loadProfile(session.user.id);
        else setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    setProfile(data);
    setLoading(false);
  };

  useEffect(() => {
    if (!loading) {
      if (!session) {
        navigate("/auth");
      } else if (profile) {
        if (profile.status !== "active") {
          supabase.auth.signOut();
          toast.error("Seu acesso foi desativado ou ainda não foi aprovado.");
          navigate("/auth");
        } else {
          const path = location.pathname.replace("/", "") || "dashboard";
          const hasPermission = profile.role === 'admin' || profile.permissions?.[path];
          
          if (!hasPermission && path !== "auth") {
            toast.error("Você não tem permissão para acessar esta página.");
            navigate("/");
          }
        }
      }
    }
  }, [loading, session, profile, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!session || !profile) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar userProfile={profile} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border bg-card flex items-center px-4">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground">
                Olá, {profile.full_name}
              </span>
            </div>
          </header>
          <main className="flex-1 p-6 bg-background overflow-auto">
            {children}
          </main>
          <footer className="p-4 border-t bg-card text-center text-xs text-muted-foreground">
            © Copyright 2026 Eder Dias | Desenvolvido por Eder Dias
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}