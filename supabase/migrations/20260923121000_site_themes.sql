-- Temas do site: qualquer visitante pode ler (o seletor de tema é público),
-- só admin cria/edita/apaga (mesmo padrão de has_role já usado nas outras tabelas).
CREATE TABLE public.site_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_themes_public_read" ON public.site_themes
  FOR SELECT USING (true);

CREATE POLICY "site_themes_admin_write" ON public.site_themes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site_themes_admin_update" ON public.site_themes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "site_themes_admin_delete" ON public.site_themes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Semeia os dois temas que já existiam como CSS fixo, agora editáveis pelo painel.
INSERT INTO public.site_themes (slug, name, colors, is_default) VALUES
('arcane', 'Arcano', '{
  "background": "oklch(0.16 0.03 285)",
  "foreground": "oklch(0.95 0.01 280)",
  "surface": "oklch(0.2 0.04 285)",
  "card": "oklch(0.2 0.04 285 / 0.6)",
  "primary": "oklch(0.68 0.19 295)",
  "primary-foreground": "oklch(0.99 0 0)",
  "secondary": "oklch(0.28 0.05 285)",
  "muted": "oklch(0.24 0.03 285)",
  "muted-foreground": "oklch(0.68 0.03 280)",
  "accent": "oklch(0.75 0.16 220)",
  "accent-foreground": "oklch(0.14 0.03 285)",
  "arcane": "oklch(0.68 0.19 295)",
  "ember": "oklch(0.75 0.18 25)",
  "frost": "oklch(0.78 0.14 210)",
  "border": "oklch(0.32 0.04 285 / 0.6)"
}'::jsonb, true),
('aureo', 'Áureo', '{
  "background": "oklch(0.15 0.02 155)",
  "foreground": "oklch(0.94 0.02 90)",
  "surface": "oklch(0.19 0.025 155)",
  "card": "oklch(0.19 0.025 155 / 0.65)",
  "primary": "oklch(0.78 0.15 85)",
  "primary-foreground": "oklch(0.16 0.03 85)",
  "secondary": "oklch(0.26 0.03 155)",
  "muted": "oklch(0.22 0.02 155)",
  "muted-foreground": "oklch(0.68 0.04 110)",
  "accent": "oklch(0.74 0.13 175)",
  "accent-foreground": "oklch(0.14 0.03 175)",
  "arcane": "oklch(0.78 0.15 85)",
  "ember": "oklch(0.62 0.22 25)",
  "frost": "oklch(0.74 0.13 175)",
  "border": "oklch(0.6 0.1 85 / 0.4)"
}'::jsonb, false);
