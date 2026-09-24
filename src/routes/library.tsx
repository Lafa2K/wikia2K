import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { fetchPublishedPages, type WikiPage } from "@/lib/wiki";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Eye, Search } from "lucide-react";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Biblioteca — Game Book" },
      { name: "description", content: "Todas as páginas publicadas do grimório." },
      { property: "og:title", content: "Biblioteca — Game Book" },
      { property: "og:description", content: "Todas as páginas publicadas do grimório." },
    ],
  }),
  component: Library,
});

function Library() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => { fetchPublishedPages().then(setPages); }, []);

  const filtered = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(q.toLowerCase()) ||
      (p.excerpt ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <SiteShell>
      <div className="mb-8">
        <h1 className="text-4xl font-[var(--font-display)]">Biblioteca</h1>
        <p className="text-muted-foreground mt-2">Todas as páginas publicadas do grimório.</p>
      </div>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar página..." className="pl-9" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <Link key={p.id} to="/wiki/$slug" params={{ slug: p.slug }}>
            <Card className="glass overflow-hidden hover:border-primary/50 transition-colors h-full">
              {p.cover_image ? (
                <img src={p.cover_image} alt="" className="w-full h-32 object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-32" style={{ background: "var(--gradient-hero)" }} />
              )}
              <div className="p-4">
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.excerpt}</div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Eye className="h-3 w-3" /> {p.view_count}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </SiteShell>
  );
}
