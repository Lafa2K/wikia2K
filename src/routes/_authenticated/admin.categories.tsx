import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { fetchCategories, slugify, type Category } from "@/lib/wiki";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesAdmin,
});

function CategoriesAdmin() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#a78bfa");
  const [saving, setSaving] = useState(false);

  async function load() { setCats(await fetchCategories()); }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!name.trim()) return toast.error("Nome obrigatório");
    setSaving(true);
    const { error } = await supabase.from("categories").insert({
      name, description, color, slug: slugify(name), sort_order: cats.length + 1,
    });
    setSaving(false);
    if (error) return toast.error("Falha", { description: error.message });
    setName(""); setDescription("");
    toast.success("Categoria criada");
    load();
  }

  async function del(id: string) {
    if (!confirm("Apagar esta categoria?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error("Falha", { description: error.message });
    toast.success("Apagada");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-[var(--font-display)]">Categorias</h1>
        <p className="text-sm text-muted-foreground">Organize as páginas em categorias temáticas</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card className="glass overflow-hidden">
          <div className="divide-y divide-border/50">
            {cats.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-4">
                <span className="h-6 w-6 rounded-md" style={{ background: c.color ?? "#a78bfa" }} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{c.description}</div>
                </div>
                <span className="text-xs text-muted-foreground">/{c.slug}</span>
                <Button variant="ghost" size="icon" onClick={() => del(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {cats.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">Sem categorias.</div>}
          </div>
        </Card>

        <Card className="glass p-4 space-y-3 h-fit">
          <h2 className="text-lg font-[var(--font-display)]">Nova categoria</h2>
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid gap-2">
            <Label>Cor</Label>
            <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full" />
          </div>
          <Button onClick={create} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Criar categoria
          </Button>
        </Card>
      </div>
    </div>
  );
}
