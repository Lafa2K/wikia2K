import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchDashboardStats, fetchAllPagesAdmin, type WikiPage } from "@/lib/wiki";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileEdit, Eye, Tags, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [stats, setStats] = useState({ totalPages: 0, totalCategories: 0, totalDrafts: 0, totalViews: 0 });
  const [pages, setPages] = useState<WikiPage[]>([]);

  useEffect(() => {
    fetchDashboardStats().then(setStats);
    fetchAllPagesAdmin().then(setPages);
  }, []);

  const drafts = pages.filter((p) => p.status === "draft").slice(0, 5);
  const topViewed = [...pages].filter((p) => p.status === "published").sort((a, b) => b.view_count - a.view_count).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-[var(--font-display)]">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Panorama do seu grimório</p>
        </div>
        <Button asChild>
          <Link to="/admin/pages/new"><Plus className="h-4 w-4 mr-2" /> Nova página</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Páginas" value={stats.totalPages} icon={<BookOpen className="h-4 w-4" />} tint="var(--arcane)" />
        <MetricCard label="Categorias" value={stats.totalCategories} icon={<Tags className="h-4 w-4" />} tint="var(--frost)" />
        <MetricCard label="Rascunhos" value={stats.totalDrafts} icon={<FileEdit className="h-4 w-4" />} tint="var(--ember)" />
        <MetricCard label="Visualizações" value={stats.totalViews} icon={<Eye className="h-4 w-4" />} tint="var(--arcane)" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileEdit className="h-4 w-4 text-[color:var(--ember)]" />
            <h2 className="text-lg font-[var(--font-display)]">Rascunhos pendentes</h2>
          </div>
          <div className="space-y-2">
            {drafts.map((p) => (
              <Link key={p.id} to="/admin/pages/$id" params={{ id: p.id }} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors">
                <span className="truncate">{p.title || "(sem título)"}</span>
                <Badge variant="secondary">rascunho</Badge>
              </Link>
            ))}
            {drafts.length === 0 && <div className="text-sm text-muted-foreground">Nenhum rascunho.</div>}
          </div>
        </Card>

        <Card className="glass p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-[color:var(--arcane)]" />
            <h2 className="text-lg font-[var(--font-display)]">Mais visitadas</h2>
          </div>
          <div className="space-y-2">
            {topViewed.map((p) => (
              <Link key={p.id} to="/wiki/$slug" params={{ slug: p.slug }} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors">
                <span className="truncate">{p.title}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {p.view_count}</span>
              </Link>
            ))}
            {topViewed.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma página publicada ainda.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, tint }: { label: string; value: number; icon: React.ReactNode; tint: string }) {
  return (
    <Card className="glass p-5 relative overflow-hidden">
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: `oklch(from ${tint} l c h)` }} />
      <div className="flex items-center justify-between text-muted-foreground text-xs mb-3">
        <span>{label}</span>
        <span style={{ color: tint }}>{icon}</span>
      </div>
      <div className="text-4xl font-[var(--font-display)]">{value}</div>
    </Card>
  );
}
