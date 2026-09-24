import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { WikiPage, Category } from "@/lib/wiki";
import { Eye } from "lucide-react";

export const Route = createFileRoute("/category/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Categoria ${params.slug} — Game Book` },
      { name: "description", content: `Páginas da categoria ${params.slug} no grimório Game Book.` },
      { property: "og:title", content: `Categoria ${params.slug} — Game Book` },
      { property: "og:description", content: `Páginas da categoria ${params.slug}.` },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const [cat, setCat] = useState<Category | null>(null);
  const [pages, setPages] = useState<WikiPage[]>([]);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
      setCat(c as Category | null);
      if (c) {
        const { data: p } = await supabase
          .from("wiki_pages")
          .select("*")
          .eq("category_id", (c as Category).id)
          .eq("status", "published")
          .order("updated_at", { ascending: false });
        setPages((p as WikiPage[]) ?? []);
      }
    })();
  }, [slug]);

  return (
    <SiteShell>
      <div className="mb-8">
        <div className="text-xs text-muted-foreground mb-2">Categoria</div>
        <h1 className="text-4xl font-[var(--font-display)]" style={{ color: cat?.color ?? "var(--foreground)" }}>
          {cat?.name ?? slug}
        </h1>
        {cat?.description && <p className="text-muted-foreground mt-2">{cat.description}</p>}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((p) => (
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
        {pages.length === 0 && (
          <Card className="glass p-6 col-span-full text-muted-foreground">
            Nenhuma página nesta categoria ainda.
          </Card>
        )}
      </div>
    </SiteShell>
  );
}
