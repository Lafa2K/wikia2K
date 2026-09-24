import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Home, LayoutDashboard, LogIn, Search, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, type Category } from "@/lib/wiki";
import { useAuth } from "@/lib/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteShell({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const { user, isAdmin } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  return (
    <div className="min-h-screen flex w-full">
      <aside className="hidden md:flex w-72 flex-col glass-strong border-r border-border sticky top-0 h-screen">
        <Link to="/" className="px-6 py-6 flex items-center gap-3 border-b border-border">
          <div className="h-10 w-10 rounded-lg rune-border flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-[color:var(--arcane)]" />
          </div>
          <div>
            <div className="font-[var(--font-display)] text-lg tracking-wide">Game Book</div>
            <div className="text-xs text-muted-foreground">Grimório do universo</div>
          </div>
        </Link>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <NavItem to="/" icon={<Home className="h-4 w-4" />} label="Início" active={pathname === "/"} />
          <NavItem to="/library" icon={<BookOpen className="h-4 w-4" />} label="Biblioteca" active={pathname === "/library"} />

          <div className="pt-4 pb-2 px-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            Categorias
          </div>
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/category/$slug"
              params={{ slug: c.slug }}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-secondary/50 transition-colors",
                pathname === `/category/${c.slug}` && "bg-secondary/60"
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: c.color ?? "var(--primary)" }}
              />
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          {isAdmin && (
            <Button asChild variant="secondary" size="sm" className="w-full">
              <Link to="/admin">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Painel Admin
              </Link>
            </Button>
          )}
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/";
              }}
            >
              Sair
            </Button>
          ) : (
            <Button asChild size="sm" className="w-full">
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="glass sticky top-0 z-30 border-b border-border">
          <div className="flex items-center gap-3 px-4 md:px-8 h-16">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no grimório..."
                className="pl-9 bg-input/60"
              />
            </div>
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Wiki online
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-secondary/50 transition-colors",
        active && "bg-secondary/60 text-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
