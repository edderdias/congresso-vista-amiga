import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen flex flex-col bg-slate-100">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="flex w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden min-h-[600px]">
          {/* Lado Esquerdo: Formulário (Verde) */}
          <div className="w-full lg:w-[35%] bg-[#2e7d32] p-8 lg:p-12 text-white flex flex-col items-center justify-center">
            <div className="mb-8">
               <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center p-2">
                 <img src="/sistema da congregação.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
               </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-10 text-center">
              {isLogin ? "Bem-vindo ao Sistema" : "Crie sua conta"}
            </h2>

            {isLogin ? (
              <form onSubmit={handleLogin} className="w-full space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white/90 text-sm font-medium">Seu e-mail</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    className="bg-white text-black border-none h-11 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-white/90 text-sm font-medium">Sua senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    className="bg-white text-black border-none h-11 focus-visible:ring-offset-0"
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-white text-[#2e7d32] hover:bg-white/90 font-bold text-base transition-colors" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <div className="text-center space-y-3 pt-4">
                  <button type="button" className="text-sm text-white/80 hover:text-white transition-colors block w-full">
                    Esqueceu sua senha?
                  </button>
                  <button type="button" onClick={() => setIsLogin(false)} className="text-sm text-white/80 hover:text-white transition-colors block w-full">
                    Não tem uma conta? Registre-se
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="w-full space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="signup-name" className="text-white/90 text-sm">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                    className="bg-white text-black border-none h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-white/90 text-sm">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    className="bg-white text-black border-none h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-white/90 text-sm">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    className="bg-white text-black border-none h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-confirm" className="text-white/90 text-sm">Confirmar Senha</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                    className="bg-white text-black border-none h-10"
                  />
                </div>
                <Button type="submit" className="w-full h-11 bg-white text-[#2e7d32] hover:bg-white/90 font-bold text-base mt-4" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => setIsLogin(true)} className="text-sm text-white/80 hover:text-white">
                    Já tem uma conta? Faça login
                  </button>
                </div>
              </form>
            )}
          </div>
          
          {/* Lado Direito: Imagem (Branco) */}
          <div className="hidden lg:flex lg:w-[65%] items-center justify-center p-16 bg-white">
            <div className="max-w-lg w-full text-center">
              <img 
                src="/sistema da congregação.png" 
                alt="Sistema da Congregação" 
                className="w-full h-auto object-contain"
              />
            </div>
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