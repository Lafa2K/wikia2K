import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchAllPagesAdmin, type WikiPage } from "@/lib/wiki";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/pages/")({
  component: PagesList,
});

function PagesList() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    setPages(await fetchAllPagesAdmin());
  }
  useEffect(() => { load(); }, []);

  async function del(id: string) {
    if (!confirm("Apagar esta página?")) return;
    const { error } = await supabase.from("wiki_pages").delete().eq("id", id);
    if (error) return toast.error("Falha ao apagar", { description: error.message });
    toast.success("Página apagada");
    load();
  }

  const filtered = pages.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-[var(--font-display)]">Páginas</h1>
          <p className="text-sm text-muted-foreground">Gerencie todas as páginas do grimório</p>
        </div>
        <Button asChild><Link to="/admin/pages/new"><Plus className="h-4 w-4 mr-2" /> Nova página</Link></Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="pl-9" />
      </div>

      <Card className="glass overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground border-b border-border">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Visualizações</th>
              <th className="px-4 py-3">Atualizada</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <Link to="/admin/pages/$id" params={{ id: p.id }} className="hover:text-primary">
                    {p.title || "(sem título)"}
                  </Link>
                  <div className="text-xs text-muted-foreground">/{p.slug}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={p.status === "published" ? "default" : "secondary"}>
                    {p.status === "published" ? "publicada" : "rascunho"}
                  </Badge>
                  {p.is_featured && <Badge className="ml-1 bg-primary/20 text-primary">destaque</Badge>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.view_count}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(p.updated_at).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {p.status === "published" && (
                      <Button asChild variant="ghost" size="icon">
                        <Link to="/wiki/$slug" params={{ slug: p.slug }} target="_blank"><ExternalLink className="h-4 w-4" /></Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => del(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Nenhuma página.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
