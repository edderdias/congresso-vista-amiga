import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [congregationName, setCongregationName] = useState("");
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "",
    fullName: ""
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
    loadSettings();
  }, [navigate]);

  const loadSettings = async () => {
    const { data } = await supabase.from("settings").select("congregation_name").single();
    if (data) setCongregationName(data.congregation_name);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    if (error) {
      setLoading(false);
      toast.error("Erro no login: " + error.message);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", data.user.id)
      .single();

    setLoading(false);

    if (profile?.status !== "active") {
      await supabase.auth.signOut();
      toast.error("Seu acesso ainda não foi aprovado pelo administrador.");
    } else {
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupData.password !== signupData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: { data: { full_name: signupData.fullName } },
    });

    setLoading(false);
    if (error) toast.error("Erro no cadastro: " + error.message);
    else {
      toast.success("Cadastro realizado! Aguarde a aprovação do administrador.");
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl bg-white border-none">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-primary">
            Sistema da Congregação
          </CardTitle>
          {congregationName && (
            <p className="text-lg font-semibold text-muted-foreground">{congregationName}</p>
          )}
          <CardDescription className="text-base">
            Gerencie sua congregação de forma eficiente.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={isLogin ? "login" : "signup"} onValueChange={(v) => setIsLogin(v === "login")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input id="login-password" type="password" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input id="signup-name" type="text" value={signupData.fullName} onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input id="signup-password" type="password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                  <Input id="signup-confirm" type="password" value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <footer className="mt-8 text-muted-foreground text-sm text-center">
        <p>© Copyright 2026 Eder Dias | Desenvolvido por Eder Dias</p>
      </footer>
    </div>
  );
}