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
        <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
          <header className="sticky top-0 z-30 flex h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 items-center gap-2 border-b border-border bg-card px-3 pt-[env(safe-area-inset-top)] sm:px-4">
            <SidebarTrigger className="h-9 w-9" />
            <span className="font-semibold sm:hidden">Congregação</span>
            <div className="ml-auto flex min-w-0 items-center gap-4">
              <span className="truncate text-sm font-medium text-muted-foreground">
                <span className="hidden sm:inline">Olá, </span>
                {profile.full_name}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background p-4 sm:p-6">
            {children}
          </main>
          <footer className="border-t bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-center text-xs text-muted-foreground">
            © Copyright 2026 Eder Dias | Desenvolvido por Eder Dias
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}