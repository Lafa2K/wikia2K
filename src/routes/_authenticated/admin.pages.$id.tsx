import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageEditor, pageToValue, type PageEditorValue } from "@/components/page-editor";
import { VersionHistory } from "@/components/version-history";
import { fetchCategories, type Category, type WikiPage } from "@/lib/wiki";
import { supabase } from "@/integrations/supabase/client";
import {
  useDraftAutosave,
  useUnsavedChangesWarning,
  readDraft,
  clearDraft,
} from "@/lib/draft-storage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pages/$id")({
  component: EditPage,
});

function EditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [value, setValue] = useState<PageEditorValue | null>(null);
  const [original, setOriginal] = useState<WikiPage | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  const draftScope = `page:${id}`;

  useEffect(() => {
    (async () => {
      const [{ data }, cats] = await Promise.all([
        supabase.from("wiki_pages").select("*").eq("id", id).maybeSingle(),
        fetchCategories(),
      ]);
      const loaded = pageToValue(data as WikiPage);
      setOriginal(data as WikiPage);
      setCategories(cats);

      const draft = readDraft<PageEditorValue>(draftScope);
      if (draft && JSON.stringify(draft.value) !== JSON.stringify(loaded)) {
        const when = new Date(draft.savedAt).toLocaleString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });
        toast("Rascunho não salvo encontrado", {
          description: `De ${when}. Restaurar ou descartar?`,
          duration: 15000,
          action: {
            label: "Restaurar",
            onClick: () => setValue(draft.value),
          },
          cancel: {
            label: "Descartar",
            onClick: () => clearDraft(draftScope),
          },
        });
      }
      setValue(loaded);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const dirty = useMemo(
    () => !!value && !!original && JSON.stringify(value) !== JSON.stringify(pageToValue(original)),
    [value, original],
  );

  useDraftAutosave(draftScope, value, dirty);
  useUnsavedChangesWarning(dirty);

  async function save() {
    if (!value) return;
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();

    if (original) {
      await supabase.from("page_revisions").insert({
        page_id: id, title: original.title, content_md: original.content_md, editor_id: userRes.user?.id,
      });
    }

    const { error } = await supabase
      .from("wiki_pages")
      .update({
        title: value.title,
        slug: value.slug,
        excerpt: value.excerpt || null,
        content_md: value.content_md,
        cover_image: value.cover_image || null,
        category_id: value.category_id,
        status: value.status,
        is_featured: value.is_featured,
        published_at: value.status === "published"
          ? (original?.published_at ?? new Date().toISOString())
          : null,
      })
      .eq("id", id);
    setSaving(false);
    if (error) return toast.error("Falha ao salvar", { description: error.message });
    toast.success("Página salva");
    clearDraft(draftScope);
    const { data } = await supabase.from("wiki_pages").select("*").eq("id", id).maybeSingle();
    setOriginal(data as WikiPage);
  }

  if (!value) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/pages"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Link>
          </Button>
          <h1 className="text-2xl font-[var(--font-display)]">Editar página</h1>
          {dirty && <span className="text-xs text-[color:var(--ember)]">alterações não salvas</span>}
        </div>
        <div className="flex items-center gap-2">
          <VersionHistory
            pageId={id}
            onRestore={(rev) => setValue({ ...value, title: rev.title, content_md: rev.content_md })}
          />
          {value.status === "published" && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/wiki/$slug" params={{ slug: value.slug }} target="_blank">Ver publicada</Link>
            </Button>
          )}
        </div>
      </div>
      <PageEditor value={value} onChange={setValue} categories={categories} onSave={save} saving={saving} />
    </div>
  );
}
