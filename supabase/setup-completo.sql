-- ============================================================
-- SETUP COMPLETO DO BANCO — Game Book Wiki
-- Cole este arquivo inteiro no SQL Editor do Supabase e clique em RUN.
-- Junta todas as migrations de supabase/migrations/ em um único script,
-- na ordem certa, para rodar em UM clique só.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- migration original: 20260729185600_ddf91056-d8d6-4104-9242-f3fb88988c92.sql
-- ------------------------------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.wiki_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content_md text NOT NULL DEFAULT '',
  cover_image text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  is_featured boolean DEFAULT false,
  view_count int DEFAULT 0,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz
);
GRANT SELECT ON public.wiki_pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.wiki_pages TO authenticated;
GRANT ALL ON public.wiki_pages TO service_role;
ALTER TABLE public.wiki_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published pages public" ON public.wiki_pages FOR SELECT USING (status='published');
CREATE POLICY "Admins read all pages" ON public.wiki_pages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage pages" ON public.wiki_pages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX wiki_pages_status_idx ON public.wiki_pages(status);
CREATE INDEX wiki_pages_category_idx ON public.wiki_pages(category_id);

CREATE TABLE public.page_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.wiki_pages(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content_md text NOT NULL,
  editor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT ON public.page_revisions TO authenticated;
GRANT ALL ON public.page_revisions TO service_role;
ALTER TABLE public.page_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view revisions" ON public.page_revisions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert revisions" ON public.page_revisions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER wiki_pages_updated BEFORE UPDATE ON public.wiki_pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.increment_page_views(_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.wiki_pages SET view_count = view_count + 1 WHERE slug = _slug AND status = 'published';
$$;
GRANT EXECUTE ON FUNCTION public.increment_page_views(text) TO anon, authenticated;

INSERT INTO public.categories (slug,name,description,icon,color,sort_order) VALUES
  ('lore','Lore & História','Mundo, história e mitologia do universo','BookOpen','#a78bfa',1),
  ('characters','Personagens','Personagens, classes e facções','Users','#f472b6',2),
  ('mechanics','Mecânicas','Sistemas, regras e mecânicas de jogo','Cog','#60a5fa',3),
  ('items','Itens & Recursos','Itens, artefatos e recursos','Package','#fbbf24',4),
  ('locations','Locais','Mapas, regiões e pontos de interesse','MapPin','#34d399',5);

INSERT INTO public.wiki_pages (slug,title,excerpt,content_md,status,is_featured,category_id,published_at)
SELECT
  'bem-vindo',
  'Bem-vindo ao Game Book',
  'Ponto de partida para explorar o universo do jogo.',
  E'# Bem-vindo ao Game Book\n\nEste é o **guia definitivo** do universo do jogo. Explore as categorias no menu lateral para descobrir:\n\n- Lore e história do mundo\n- Personagens jogáveis\n- Mecânicas de combate\n- Itens raros e artefatos\n\n> "Todo herói começa com uma primeira página." — Sábio Anônimo\n\n## Como usar\n\n1. Navegue pelas categorias\n2. Clique nas páginas em destaque\n3. Use a busca para achar rapidamente',
  'published', true, id, now()
FROM public.categories WHERE slug='lore';
-- ------------------------------------------------------------
-- migration original: 20260729185644_66d67862-264c-487f-a737-5d93c76aa598.sql
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
-- ------------------------------------------------------------
-- migration original: 20260729185744_9dd6ce73-c3b2-4743-9e8f-198b552ab904.sql
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
-- ------------------------------------------------------------
-- migration original: 20260729185846_0cb7254b-e79a-48e5-8e55-b7a38e3aa050.sql
-- ------------------------------------------------------------
CREATE POLICY "wiki_assets_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'wiki-assets');
CREATE POLICY "wiki_assets_admin_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'wiki-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "wiki_assets_admin_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'wiki-assets' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "wiki_assets_admin_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'wiki-assets' AND public.has_role(auth.uid(),'admin'));
-- ------------------------------------------------------------
-- migration original: 20260729190112_43c14d39-47d2-49b5-b831-73c706f5167c.sql
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_exists boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO admin_exists;
  IF admin_exists THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
    ON CONFLICT DO NOTHING;
  RETURN true;
END; $$;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
-- ------------------------------------------------------------
-- migration original: 20260922200000_remove_claim_first_admin.sql
-- ------------------------------------------------------------
-- Remove o fluxo de auto-atribuição de admin ("primeiro a clicar vira admin").
-- A partir de agora, o papel de admin só pode ser concedido manualmente,
-- via SQL Editor do Supabase, pelo responsável do projeto.
DROP FUNCTION IF EXISTS public.claim_first_admin();

-- ------------------------------------------------------------
-- migration original: 20260922210000_create_wiki_assets_bucket.sql
-- ------------------------------------------------------------
-- Lovable Cloud provisionava este bucket automaticamente.
-- Em um projeto Supabase próprio, ele precisa fazer parte das migrations.
INSERT INTO storage.buckets (id, name, public)
VALUES ('wiki-assets', 'wiki-assets', false)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- migration original: 20260923120000_public_permanent_images.sql
-- ------------------------------------------------------------
  -- 1) Bucket de imagens público (leitura livre, sem link expirando) + limites de upload.
  --    Escrita continua só-admin (policies já existentes: wiki_assets_admin_insert/update/delete).
  UPDATE storage.buckets
  SET
    public = true,
    file_size_limit = 8388608, -- 8 MB
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  WHERE id = 'wiki-assets';

  -- 2) Corrige links já salvos (assinados, com token que expira em 1 ano) para o formato
  --    público permanente, tanto na capa quanto dentro do corpo em Markdown das páginas.
  UPDATE public.wiki_pages
  SET cover_image = regexp_replace(
    cover_image,
    '/object/sign/wiki-assets/([^?]*)\?token=[^&"\s)]*',
    '/object/public/wiki-assets/\1',
    'g'
  )
  WHERE cover_image LIKE '%/object/sign/wiki-assets/%';

  UPDATE public.wiki_pages
  SET content_md = regexp_replace(
    content_md,
    '/object/sign/wiki-assets/([^?]*)\?token=[^&"\s)]*',
    '/object/public/wiki-assets/\1',
    'g'
  )
  WHERE content_md LIKE '%/object/sign/wiki-assets/%';

-- ------------------------------------------------------------
-- migration original: 20260923121000_site_themes.sql
-- ------------------------------------------------------------
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

