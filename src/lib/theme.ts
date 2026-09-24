import { supabase } from "@/integrations/supabase/client";

export const THEME_COLORS_CACHE_KEY = "gamebook-theme-colors";
export const THEME_SLUG_CACHE_KEY = "gamebook-theme-slug";

/** Tokens editáveis no painel. Qualquer outra variável de --root cai no valor padrão. */
export const THEME_TOKENS: { key: string; label: string; group: string }[] = [
  { key: "background", label: "Fundo", group: "Base" },
  { key: "foreground", label: "Texto", group: "Base" },
  { key: "surface", label: "Superfície (cards, painéis)", group: "Superfícies" },
  { key: "card", label: "Cartões", group: "Superfícies" },
  { key: "muted", label: "Área neutra", group: "Superfícies" },
  { key: "muted-foreground", label: "Texto neutro", group: "Superfícies" },
  { key: "border", label: "Bordas", group: "Superfícies" },
  { key: "primary", label: "Cor primária (botões)", group: "Destaques" },
  { key: "primary-foreground", label: "Texto sobre a primária", group: "Destaques" },
  { key: "secondary", label: "Cor secundária", group: "Destaques" },
  { key: "accent", label: "Cor de destaque", group: "Destaques" },
  { key: "accent-foreground", label: "Texto sobre o destaque", group: "Destaques" },
  { key: "arcane", label: "Brilho especial (títulos, bordas)", group: "Acentos" },
  { key: "ember", label: "Alerta / perigo", group: "Acentos" },
  { key: "frost", label: "Sucesso / confirmação", group: "Acentos" },
];

export type ThemeColors = Record<string, string>;

export type SiteTheme = {
  id: string;
  slug: string;
  name: string;
  colors: ThemeColors;
  is_default: boolean;
};

export async function fetchThemes(): Promise<SiteTheme[]> {
  const { data, error } = await supabase
    .from("site_themes")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    colors: (t.colors as ThemeColors) ?? {},
    is_default: t.is_default,
  }));
}

export async function saveTheme(theme: {
  id?: string;
  slug: string;
  name: string;
  colors: ThemeColors;
}) {
  if (theme.id) {
    const { error } = await supabase
      .from("site_themes")
      .update({ name: theme.name, colors: theme.colors, updated_at: new Date().toISOString() })
      .eq("id", theme.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("site_themes")
      .insert({ slug: theme.slug, name: theme.name, colors: theme.colors });
    if (error) throw error;
  }
}

export async function deleteTheme(id: string) {
  const { error } = await supabase.from("site_themes").delete().eq("id", id);
  if (error) throw error;
}

export async function setDefaultTheme(id: string) {
  const { error: e1 } = await supabase
    .from("site_themes")
    .update({ is_default: false })
    .neq("id", id);
  if (e1) throw e1;
  const { error: e2 } = await supabase.from("site_themes").update({ is_default: true }).eq("id", id);
  if (e2) throw e2;
}

/** Aplica um conjunto de cores diretamente no <html>, sobrescrevendo o CSS padrão. */
export function applyThemeColors(colors: ThemeColors) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const token of THEME_TOKENS) {
    const value = colors[token.key];
    if (value) root.style.setProperty(`--${token.key}`, value);
    else root.style.removeProperty(`--${token.key}`);
  }
}

export function persistThemeChoice(slug: string, colors: ThemeColors) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_SLUG_CACHE_KEY, slug);
  window.localStorage.setItem(THEME_COLORS_CACHE_KEY, JSON.stringify(colors));
}

export function getCachedTheme(): { slug: string; colors: ThemeColors } | null {
  if (typeof window === "undefined") return null;
  const slug = window.localStorage.getItem(THEME_SLUG_CACHE_KEY);
  const raw = window.localStorage.getItem(THEME_COLORS_CACHE_KEY);
  if (!slug || !raw) return null;
  try {
    return { slug, colors: JSON.parse(raw) };
  } catch {
    return null;
  }
}

/**
 * Roda inline no <head>, antes da hidratação do React, aplicando o último tema
 * visto em cache local — evita o "flash" da paleta padrão ao carregar a página.
 * A lista real de temas (para trocar) só é buscada depois, no ThemeToggle.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem('${THEME_COLORS_CACHE_KEY}');
    if (!raw) return;
    var colors = JSON.parse(raw);
    var root = document.documentElement;
    for (var k in colors) { root.style.setProperty('--' + k, colors[k]); }
  } catch (e) {}
})();
`;
