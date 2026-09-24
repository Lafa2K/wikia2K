import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageEditor, pageToValue, type PageEditorValue } from "@/components/page-editor";
import { fetchCategories, type Category } from "@/lib/wiki";
import { supabase } from "@/integrations/supabase/client";
import { useDraftAutosave, useUnsavedChangesWarning, readDraft, clearDraft } from "@/lib/draft-storage";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/pages/new")({
  component: NewPage,
});

const DRAFT_SCOPE = "page:new";

function NewPage() {
  const navigate = useNavigate();
  const [value, setValue] = useState<PageEditorValue>(pageToValue());
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories().then(setCategories);
    const draft = readDraft<PageEditorValue>(DRAFT_SCOPE);
    if (draft && (draft.value.title || draft.value.content_md)) {
      const when = new Date(draft.savedAt).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      toast("Rascunho não salvo encontrado", {
        description: `De ${when}. Restaurar ou descartar?`,
        duration: 15000,
        action: { label: "Restaurar", onClick: () => setValue(draft.value) },
        cancel: { label: "Descartar", onClick: () => clearDraft(DRAFT_SCOPE) },
      });
    }
  }, []);

  const dirty = !!(value.title || value.content_md);
  useDraftAutosave(DRAFT_SCOPE, value, dirty);
  useUnsavedChangesWarning(dirty);

  async function save() {
    if (!value.title || !value.slug) return toast.error("Título e slug obrigatórios");
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("wiki_pages")
      .insert({
        title: value.title,
        slug: value.slug,
        excerpt: value.excerpt || null,
        content_md: value.content_md,
        cover_image: value.cover_image || null,
        category_id: value.category_id,
        status: value.status,
        is_featured: value.is_featured,
        author_id: userRes.user?.id,
        published_at: value.status === "published" ? new Date().toISOString() : null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error("Falha ao criar", { description: error.message });
    toast.success("Página criada");
    clearDraft(DRAFT_SCOPE);
    navigate({ to: "/admin/pages/$id", params: { id: data.id } });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/pages"><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Link>
        </Button>
        <h1 className="text-2xl font-[var(--font-display)]">Nova página</h1>
        {dirty && <span className="text-xs text-[color:var(--ember)]">alterações não salvas</span>}
      </div>
      <PageEditor value={value} onChange={setValue} categories={categories} onSave={save} saving={saving} />
    </div>
  );
}
