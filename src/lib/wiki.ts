import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number | null;
};

export type WikiPage = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  cover_image: string | null;
  category_id: string | null;
  status: "draft" | "published";
  is_featured: boolean;
  view_count: number;
  author_id: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export async function fetchPublishedPages(): Promise<WikiPage[]> {
  const { data, error } = await supabase
    .from("wiki_pages")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as WikiPage[]) ?? [];
}

export async function fetchPageBySlug(slug: string): Promise<WikiPage | null> {
  const { data, error } = await supabase
    .from("wiki_pages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data as WikiPage | null;
}

export async function fetchAllPagesAdmin(): Promise<WikiPage[]> {
  const { data, error } = await supabase
    .from("wiki_pages")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as WikiPage[]) ?? [];
}

export async function fetchDashboardStats() {
  const [pagesRes, catsRes, draftsRes, viewsRes] = await Promise.all([
    supabase.from("wiki_pages").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("wiki_pages").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("wiki_pages").select("view_count"),
  ]);
  const totalViews = (viewsRes.data ?? []).reduce((s, r) => s + (r.view_count ?? 0), 0);
  return {
    totalPages: pagesRes.count ?? 0,
    totalCategories: catsRes.count ?? 0,
    totalDrafts: draftsRes.count ?? 0,
    totalViews,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB — mesmo limite configurado no bucket

export async function uploadWikiImage(file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Formato não aceito. Envie PNG, JPG, WEBP ou GIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Imagem muito grande (máximo 8 MB).");
  }

  const ext = file.name.split(".").pop() ?? "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("wiki-assets").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  // Bucket público (ver migration public_permanent_images): o link não expira nunca.
  const { data } = supabase.storage.from("wiki-assets").getPublicUrl(path);
  return data.publicUrl;
}
