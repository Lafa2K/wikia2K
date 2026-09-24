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
