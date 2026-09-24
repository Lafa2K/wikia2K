import { useEffect, useState } from "react";
import { History, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Revision = {
  id: string;
  title: string;
  content_md: string;
  created_at: string | null;
  editor_id: string | null;
};

export function VersionHistory({
  pageId,
  onRestore,
}: {
  pageId: string;
  onRestore: (rev: { title: string; content_md: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [preview, setPreview] = useState<Revision | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("page_revisions")
      .select("id, title, content_md, created_at, editor_id")
      .eq("page_id", pageId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setRevisions((data as Revision[]) ?? []);
        setLoading(false);
      });
  }, [open, pageId]);

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" /> Histórico
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Versões anteriores</SheetTitle>
        </SheetHeader>

        {preview ? (
          <div className="mt-4 space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>
              ← Voltar à lista
            </Button>
            <div className="text-sm text-muted-foreground">{formatDate(preview.created_at)}</div>
            <div className="text-sm font-medium">{preview.title}</div>
            <pre className="text-xs whitespace-pre-wrap bg-secondary/40 rounded-md p-3 max-h-[50vh] overflow-y-auto">
              {preview.content_md}
            </pre>
            <Button
              className="w-full"
              onClick={() => {
                onRestore({ title: preview.title, content_md: preview.content_md });
                setOpen(false);
                setPreview(null);
              }}
            >
              <RotateCcw className="h-4 w-4 mr-2" /> Restaurar esta versão no editor
            </Button>
            <p className="text-xs text-muted-foreground">
              Isso só preenche o editor — nada é salvo até você clicar em "Salvar".
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">
            Nenhuma versão anterior ainda — toda vez que você salva, o estado antigo é guardado
            aqui automaticamente.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {revisions.map((r) => (
              <button
                key={r.id}
                onClick={() => setPreview(r)}
                className="w-full text-left p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="text-sm font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground">{formatDate(r.created_at)}</div>
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
