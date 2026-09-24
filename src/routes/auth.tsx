import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Game Book" },
      { name: "description", content: "Entre no painel administrativo do Game Book." },
      { property: "og:title", content: "Entrar — Game Book" },
      { property: "og:description", content: "Acesse o painel administrativo." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "forgot" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // O Supabase redireciona de volta pra cá com um link mágico após o clique no
  // email de recuperação; esse evento troca a tela para "definir nova senha".
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Falha ao entrar", { description: error.message });
    toast.success("Bem-vindo!");
    navigate({ to: "/admin" });
  }

  async function sendRecoveryEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth",
    });
    setLoading(false);
    if (error) return toast.error("Falha ao enviar", { description: error.message });
    toast.success("Email enviado! Confira sua caixa de entrada.");
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("A senha precisa ter pelo menos 6 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) return toast.error("Falha ao trocar a senha", { description: error.message });
    toast.success("Senha atualizada! Você já está logado.");
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="glass-strong w-full max-w-md p-8 rune-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg rune-border flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-[color:var(--arcane)]" />
          </div>
          <div>
            <div className="font-[var(--font-display)] text-xl">Game Book</div>
            <div className="text-xs text-muted-foreground">Portal administrativo</div>
          </div>
        </div>

        {mode === "signin" && (
          <form onSubmit={signIn} className="space-y-3">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Senha</Label>
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Entrar
            </Button>
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 block mx-auto"
            >
              Esqueci minha senha
            </button>
          </form>
        )}

        {mode === "forgot" && (
          <form onSubmit={sendRecoveryEmail} className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Informe o email da conta. Enviamos um link para você criar uma nova senha.
            </p>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Enviar link de recuperação
            </Button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="h-3 w-3" /> Voltar para o login
            </button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={updatePassword} className="space-y-3">
            <p className="text-sm text-muted-foreground">Escolha a nova senha da sua conta.</p>
            <div className="grid gap-2">
              <Label>Nova senha</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Salvar nova senha
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Cadastro fechado — o acesso é concedido manualmente pelo responsável do wiki.
        </p>
      </Card>
    </div>
  );
}
