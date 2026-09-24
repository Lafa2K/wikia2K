import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, FileText, Tags, LogOut, ShieldAlert, Loader2, Sparkles, ArrowLeft, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="glass-strong max-w-md p-8 text-center rune-border">
          <ShieldAlert className="h-10 w-10 mx-auto text-[color:var(--ember)] mb-4" />
          <h2 className="text-2xl font-[var(--font-display)] mb-2">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Você está logado como <strong>{user?.email}</strong>, mas essa conta não tem permissão
            de administrador. O acesso é concedido manualmente pelo responsável do wiki.
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild variant="ghost">
              <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao início</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex w-full">
      <aside className="hidden md:flex w-64 flex-col glass-strong border-r border-border sticky top-0 h-screen">
        <Link to="/" className="px-6 py-6 flex items-center gap-3 border-b border-border">
          <div className="h-9 w-9 rounded-lg rune-border flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-[color:var(--arcane)]" />
          </div>
          <div>
            <div className="font-[var(--font-display)]">Game Book</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Admin</div>
          </div>
        </Link>
        <nav className="p-3 space-y-1 flex-1">
          <AdminNav to="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" active={pathname === "/admin"} />
          <AdminNav to="/admin/pages" icon={<FileText className="h-4 w-4" />} label="Páginas" active={pathname.startsWith("/admin/pages")} />
          <AdminNav to="/admin/categories" icon={<Tags className="h-4 w-4" />} label="Categorias" active={pathname.startsWith("/admin/categories")} />
          <AdminNav to="/admin/config" icon={<Palette className="h-4 w-4" />} label="Config" active={pathname.startsWith("/admin/config")} />
        </nav>
        <div className="p-3 border-t border-border space-y-2">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="w-full justify-start">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> Ver site</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminNav({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link to={to} className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-secondary/50 transition-colors",
      active && "bg-primary/20 text-foreground"
    )}>
      {icon}{label}
    </Link>
  );
}
