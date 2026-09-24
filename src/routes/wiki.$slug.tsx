import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { WikiMarkdown } from "@/components/wiki-markdown";
import { fetchPageBySlug, type WikiPage } from "@/lib/wiki";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye } from "lucide-react";

export const Route = createFileRoute("/wiki/$slug")({
  loader: async ({ params }) => {
    const page = await fetchPageBySlug(params.slug);
    if (!page || page.status !== "published") throw notFound();
    return { page };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.page.title ?? "Página"} — Game Book` },
      { name: "description", content: loaderData?.page.excerpt ?? "Página do grimório Game Book." },
      { property: "og:title", content: loaderData?.page.title ?? "Página — Game Book" },
      { property: "og:description", content: loaderData?.page.excerpt ?? "Página do grimório." },
      ...(loaderData?.page.cover_image
        ? [
            { property: "og:image", content: loaderData.page.cover_image },
            { name: "twitter:image", content: loaderData.page.cover_image },
          ]
        : []),
    ],
  }),
  notFoundComponent: () => (
    <SiteShell>
      <Card className="glass p-10 text-center">
        <div className="text-2xl mb-2">Página não encontrada</div>
        <Link to="/" className="text-primary underline">Voltar ao início</Link>
      </Card>
    </SiteShell>
  ),
  component: PageView,
});

function PageView() {
  const { page } = Route.useLoaderData();
  const [live, setLive] = useState<WikiPage>(page);

  useEffect(() => {
    supabase.rpc("increment_page_views", { _slug: page.slug });
    fetchPageBySlug(page.slug).then((p) => p && setLive(p));
  }, [page.slug]);

  return (
    <SiteShell>
      <article className="max-w-4xl mx-auto">
        {live.cover_image && (
          <div className="relative rounded-2xl overflow-hidden mb-8 rune-border">
            <img src={live.cover_image} alt="" className="w-full h-64 md:h-80 object-cover" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, oklch(0.14 0.03 275 / 0.9))" }} />
          </div>
        )}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            <Badge variant="secondary">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(live.updated_at).toLocaleDateString("pt-BR")}
            </Badge>
            <Badge variant="secondary">
              <Eye className="h-3 w-3 mr-1" />
              {live.view_count} vistas
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-[var(--font-display)]">{live.title}</h1>
          {live.excerpt && <p className="mt-3 text-muted-foreground text-lg">{live.excerpt}</p>}
        </header>

        <Card className="glass p-6 md:p-10">
          <WikiMarkdown content={live.content_md} />
        </Card>
      </article>
    </SiteShell>
  );
}
