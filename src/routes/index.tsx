import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchCategories, fetchPublishedPages, type Category, type WikiPage } from "@/lib/wiki";
import { BookOpen, Compass, Eye, Sparkles, TrendingUp } from "lucide-react";
import heroImg from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Game Book — Início" },
      { name: "description", content: "Explore o grimório do universo: lore, personagens, mecânicas, itens e locais." },
      { property: "og:title", content: "Game Book — Início" },
      { property: "og:description", content: "Explore o grimório do universo: lore, personagens, mecânicas e mais." },
    ],
  }),
  component: Home,
});

function Home() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([fetchPublishedPages(), fetchCategories()]).then(([p, c]) => {
      setPages(p);
      setCats(c);
    });
  }, []);

  const featured = pages.filter((p) => p.is_featured).slice(0, 3);
  const recent = pages.slice(0, 6);
  const totalViews = pages.reduce((s, p) => s + p.view_count, 0);

  return (
    <SiteShell>
      <section className="relative overflow-hidden rounded-2xl rune-border mb-8">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" width={1920} height={800} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.16 0.03 285 / 0.9), oklch(0.14 0.03 275 / 0.75))" }} />
        <div className="relative p-8 md:p-14">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Sparkles className="h-3 w-3 mr-1" /> Grimório vivo
          </Badge>
          <h1 className="text-4xl md:text-6xl font-[var(--font-display)] leading-tight max-w-2xl">
            O <span className="text-arcane">livro sagrado</span> do universo do jogo
          </h1>
          <p className="mt-4 text-muted-foreground max-w-xl">
            Lore, personagens, mecânicas e itens em um só lugar. Editável em Markdown pelo painel administrativo.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/library" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
              <BookOpen className="h-4 w-4" /> Explorar biblioteca
            </Link>
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm hover:bg-secondary/60">
              Entrar
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Páginas" value={pages.length} icon={<BookOpen className="h-4 w-4" />} />
        <StatCard label="Categorias" value={cats.length} icon={<Compass className="h-4 w-4" />} />
        <StatCard label="Em destaque" value={featured.length} icon={<Sparkles className="h-4 w-4" />} />
        <StatCard label="Visualizações" value={totalViews} icon={<Eye className="h-4 w-4" />} />
      </section>

      {featured.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[color:var(--arcane)]" /> Em destaque
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {featured.map((p) => (
              <PageCard key={p.id} page={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="text-2xl mb-4 flex items-center gap-2">
          <Compass className="h-5 w-5 text-[color:var(--frost)]" /> Categorias
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {cats.map((c) => (
            <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }}>
              <Card className="glass p-4 hover:border-primary/50 transition-colors h-full">
                <div className="h-10 w-10 rounded-lg mb-3 flex items-center justify-center" style={{ background: `${c.color ?? "#a78bfa"}22`, border: `1px solid ${c.color ?? "#a78bfa"}55` }}>
                  <Sparkles className="h-4 w-4" style={{ color: c.color ?? "#a78bfa" }} />
                </div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.description}</div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[color:var(--ember)]" /> Atualizadas recentemente
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recent.map((p) => (
            <PageCard key={p.id} page={p} />
          ))}
          {recent.length === 0 && (
            <Card className="glass p-6 text-muted-foreground col-span-full">
              Nenhuma página publicada ainda. Faça login e crie a primeira!
            </Card>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="glass p-4">
      <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
        <span>{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-[var(--font-display)]">{value}</div>
    </Card>
  );
}

function PageCard({ page }: { page: WikiPage }) {
  return (
    <Link to="/wiki/$slug" params={{ slug: page.slug }}>
      <Card className="glass overflow-hidden hover:border-primary/50 transition-colors h-full">
        {page.cover_image ? (
          <img src={page.cover_image} alt="" className="w-full h-32 object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-32" style={{ background: "var(--gradient-hero)" }} />
        )}
        <div className="p-4">
          <div className="font-medium mb-1 line-clamp-1">{page.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-2">{page.excerpt}</div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <Eye className="h-3 w-3" /> {page.view_count}
          </div>
        </div>
      </Card>
    </Link>
  );
}
