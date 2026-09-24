import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Palette,
  Save,
  Trash2,
  Plus,
  Star,
  Copy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  THEME_TOKENS,
  fetchThemes,
  saveTheme,
  deleteTheme,
  setDefaultTheme,
  applyThemeColors,
  type SiteTheme,
  type ThemeColors,
} from "@/lib/theme";
import { cssColorToHex } from "@/lib/oklch-to-hex";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/config")({
  component: ConfigPage,
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

function ConfigPage() {
  const [themes, setThemes] = useState<SiteTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [colors, setColors] = useState<ThemeColors>({});
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const list = await fetchThemes();
      setThemes(list);
    } catch (e) {
      toast.error("Não foi possível carregar os temas", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Pré-visualização em tempo real: qualquer alteração nas cores já reskina a página toda.
  useEffect(() => {
    if (Object.keys(colors).length > 0) applyThemeColors(colors);
  }, [colors]);

  function startEditing(theme: SiteTheme) {
    setEditingId(theme.id);
    setOriginalSlug(theme.slug);
    setName(theme.name);
    setColors(theme.colors);
  }

  function startNewTheme() {
    const base = themes[0]?.colors ?? {};
    setEditingId(null);
    setOriginalSlug(null);
    setName("Novo tema");
    setColors({ ...base });
  }

  function updateColor(key: string, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!name.trim()) return toast.error("Dê um nome ao tema");
    setSaving(true);
    try {
      const slug = originalSlug ?? (slugify(name) || `tema-${Date.now()}`);
      await saveTheme({ id: editingId ?? undefined, slug, name: name.trim(), colors });
      toast.success("Tema salvo!");
      await load();
    } catch (e) {
      toast.error("Falha ao salvar", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(theme: SiteTheme) {
    if (themes.length <= 1) return toast.error("Precisa sobrar pelo menos um tema.");
    if (!confirm(`Apagar o tema "${theme.name}"? Não tem como desfazer.`)) return;
    try {
      await deleteTheme(theme.id);
      toast.success("Tema apagado");
      if (editingId === theme.id) {
        setEditingId(null);
        setColors({});
      }
      await load();
    } catch (e) {
      toast.error("Falha ao apagar", { description: e instanceof Error ? e.message : undefined });
    }
  }

  async function handleSetDefault(theme: SiteTheme) {
    try {
      await setDefaultTheme(theme.id);
      toast.success(`"${theme.name}" agora é o tema padrão para novos visitantes`);
      await load();
    } catch (e) {
      toast.error("Falha ao definir padrão", { description: e instanceof Error ? e.message : undefined });
    }
  }

  function handleReset() {
    // Reaplica o tema que já estava salvo (descarta preview não salvo).
    const current = themes.find((t) => t.id === editingId);
    if (current) applyThemeColors(current.colors);
    else if (themes[0]) applyThemeColors(themes[0].colors);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isEditing = editingId !== null || Object.keys(colors).length > 0;
  const groups = [...new Set(THEME_TOKENS.map((t) => t.group))];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-[var(--font-display)] flex items-center gap-2">
          <Palette className="h-5 w-5 text-[color:var(--arcane)]" /> Temas
        </h1>
        <p className="text-sm text-muted-foreground">
          Crie, edite e gerencie as paletas de cores do site. A pré-visualização é em tempo real —
          a página inteira muda enquanto você ajusta as cores abaixo, mas só fica valendo pra
          todo mundo depois de clicar em Salvar.
        </p>
      </div>

      <Card className="glass p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Temas salvos
          </h2>
          <Button size="sm" variant="outline" onClick={startNewTheme}>
            <Plus className="h-4 w-4 mr-1" /> Novo tema
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => startEditing(t)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                editingId === t.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex -space-x-1 shrink-0">
                {["background", "primary", "accent", "ember"].map((k) => (
                  <span
                    key={k}
                    className="h-6 w-6 rounded-full border border-border"
                    style={{ background: t.colors[k] ?? "#333" }}
                  />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate flex items-center gap-1">
                  {t.name}
                  {t.is_default && <Star className="h-3 w-3 fill-current text-[color:var(--arcane)]" />}
                </div>
                <div className="text-xs text-muted-foreground">{t.slug}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {isEditing && (
        <Card className="glass-strong p-5 space-y-5 rune-border">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <Label className="shrink-0">Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
            </div>
            <div className="flex items-center gap-2">
              {editingId && (
                <Button size="sm" variant="outline" onClick={() => handleSetDefault(themes.find((t) => t.id === editingId)!)}>
                  <Star className="h-4 w-4 mr-1" /> Definir como padrão
                </Button>
              )}
              {editingId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setOriginalSlug(null);
                    setName(`${name} (cópia)`);
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" /> Duplicar
                </Button>
              )}
              {editingId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[color:var(--ember)]"
                  onClick={() => handleDelete(themes.find((t) => t.id === editingId)!)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Apagar
                </Button>
              )}
            </div>
          </div>

          {groups.map((group) => (
            <div key={group}>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {group}
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {THEME_TOKENS.filter((t) => t.group === group).map((token) => (
                  <div key={token.key} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cssColorToHex(colors[token.key])}
                      onChange={(e) => updateColor(token.key, e.target.value)}
                      className="h-9 w-9 shrink-0 rounded-md border border-border bg-transparent cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground truncate">{token.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar tema
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              Descartar alterações
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
