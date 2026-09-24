-- Lovable Cloud provisionava este bucket automaticamente.
-- Em um projeto Supabase próprio, ele precisa fazer parte das migrations.
INSERT INTO storage.buckets (id, name, public)
VALUES ('wiki-assets', 'wiki-assets', false)
ON CONFLICT (id) DO NOTHING;
