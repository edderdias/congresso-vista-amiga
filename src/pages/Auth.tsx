import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
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
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginData.email,
      password: loginData.password,
    });

    setLoading(false);

    if (error) {
      toast({ 
        title: "Erro no login", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast({ 
        title: "Erro", 
        description: "As senhas não coincidem", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: signupData.fullName,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast({ 
        title: "Erro no cadastro", 
        description: error.message, 
        variant: "destructive" 
      });
    } else {
      toast({ 
        title: "Cadastro realizado!", 
        description: "Você já pode fazer login" 
      });
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Lado Esquerdo: Formulário Original */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
          <Card className="w-full max-w-md shadow-xl border-none bg-white">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-3xl font-bold text-primary">
                Sistema de Congregação
              </CardTitle>
              <CardDescription>Gerencie sua congregação de forma eficiente</CardDescription>
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
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
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
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirmar Senha</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                      {loading ? "Cadastrando..." : "Cadastrar"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Lado Direito: Imagem */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-white p-8">
          <div className="max-w-xl w-full">
            <img 
              src="/sistema da congregação.png" 
              alt="Sistema da Congregação" 
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="py-6 px-4 bg-white border-t text-muted-foreground text-sm">
        <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-12">
          <p>© Copyright 2026 Eder Dias</p>
          <p>Desenvolvido por Eder Dias</p>
        </div>
      </footer>
    </div>
  );
}