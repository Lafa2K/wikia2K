import { useState, type ChangeEvent } from "react";
import MDEditor from "@uiw/react-md-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadWikiImage, type Category, type WikiPage, slugify } from "@/lib/wiki";
import { toast } from "sonner";

export type PageEditorValue = {
  title: string;
  slug: string;
  excerpt: string;
  content_md: string;
  cover_image: string;
  category_id: string | null;
  status: "draft" | "published";
  is_featured: boolean;
};

export function pageToValue(p?: WikiPage | null): PageEditorValue {
  return {
    title: p?.title ?? "",
    slug: p?.slug ?? "",
    excerpt: p?.excerpt ?? "",
    content_md: p?.content_md ?? "",
    cover_image: p?.cover_image ?? "",
    category_id: p?.category_id ?? null,
    status: (p?.status as "draft" | "published") ?? "draft",
    is_featured: p?.is_featured ?? false,
  };
}

export function PageEditor({
  value,
  onChange,
  categories,
  onSave,
  saving,
}: {
  value: PageEditorValue;
  onChange: (v: PageEditorValue) => void;
  categories: Category[];
  onSave: () => void;
  saving: boolean;
}) {
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);

  const update = <K extends keyof PageEditorValue>(k: K, v: PageEditorValue[K]) =>
    onChange({ ...value, [k]: v });

  async function handleCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadWikiImage(file);
      update("cover_image", url);
      toast.success("Capa carregada");
    } catch (err) {
      toast.error("Falha no upload", { description: (err as Error).message });
    } finally {
      setUploadingCover(false);
    }
  }

  async function handleInline(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInline(true);
    try {
      const url = await uploadWikiImage(file);
      update("content_md", `${value.content_md}\n\n![${file.name}](${url})\n`);
      toast.success("Imagem inserida no conteúdo");
    } catch (err) {
      toast.error("Falha no upload", { description: (err as Error).message });
    } finally {
      setUploadingInline(false);
      e.target.value = "";
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Card className="glass p-4 space-y-4">
          <div className="grid gap-2">
            <Label>Título</Label>
            <Input
              value={value.title}
              onChange={(e) => {
                const t = e.target.value;
                update("title", t);
                if (!value.slug || value.slug === slugify(value.title))
                  update("slug", slugify(t));
              }}
              placeholder="Nome da página"
            />
          </div>
          <div className="grid gap-2">
            <Label>Slug (URL)</Label>
            <Input
              value={value.slug}
              onChange={(e) => update("slug", slugify(e.target.value))}
              placeholder="url-amigavel"
            />
          </div>
          <div className="grid gap-2">
            <Label>Resumo</Label>
            <Textarea
              value={value.excerpt}
              onChange={(e) => update("excerpt", e.target.value)}
              placeholder="Breve descrição exibida em listagens"
              rows={2}
            />
          </div>
        </Card>

        <Card className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm">Conteúdo em Markdown</Label>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleInline}
                disabled={uploadingInline}
              />
              <span className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70">
                {uploadingInline ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImageIcon className="h-3 w-3" />}
                Inserir imagem
              </span>
            </label>
          </div>
          <div data-color-mode="dark">
            <MDEditor
              value={value.content_md}
              onChange={(v) => update("content_md", v ?? "")}
              height={520}
              preview="live"
            />
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="glass p-4 space-y-4">
          <Label className="text-sm">Publicação</Label>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Select value={value.status} onValueChange={(v) => update("status", v as "draft" | "published")}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Em destaque</span>
            <Switch checked={value.is_featured} onCheckedChange={(v) => update("is_featured", v)} />
          </div>
          <Button onClick={onSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar página
          </Button>
        </Card>

        <Card className="glass p-4 space-y-3">
          <Label className="text-sm">Categoria</Label>
          <Select
            value={value.category_id ?? "none"}
            onValueChange={(v) => update("category_id", v === "none" ? null : v)}
          >
            <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <Card className="glass p-4 space-y-3">
          <Label className="text-sm">Imagem de capa</Label>
          {value.cover_image ? (
            <img src={value.cover_image} alt="capa" className="w-full h-32 object-cover rounded-md border border-border" />
          ) : (
            <div className="w-full h-32 rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs">
              Sem capa
            </div>
          )}
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleCover} disabled={uploadingCover} />
            <span className="w-full inline-flex items-center justify-center gap-2 text-sm px-3 py-2 rounded-md bg-secondary hover:bg-secondary/70">
              {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Enviar capa
            </span>
          </label>
          {value.cover_image && (
            <Button variant="ghost" size="sm" onClick={() => update("cover_image", "")}>
              Remover capa
            </Button>
          )}
        </Card>
      </div>
    </div>
  );
}
