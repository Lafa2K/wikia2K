import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import {
  fetchThemes,
  applyThemeColors,
  persistThemeChoice,
  getCachedTheme,
  type SiteTheme,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const [themes, setThemes] = useState<SiteTheme[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCachedTheme();
    if (cached) setActiveSlug(cached.slug);

    fetchThemes()
      .then((list) => {
        setThemes(list);
        if (!cached) {
          const def = list.find((t) => t.is_default) ?? list[0];
          if (def) setActiveSlug(def.slug);
        }
      })
      .catch(() => {});
  }, []);

  function pick(theme: SiteTheme) {
    setActiveSlug(theme.slug);
    applyThemeColors(theme.colors);
    persistThemeChoice(theme.slug, theme.colors);
  }

  if (themes.length === 0) return null;

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary/40 p-1">
      <Palette className="h-3.5 w-3.5 text-muted-foreground ml-1.5 shrink-0" />
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => pick(t)}
          className={cn(
            "px-2.5 py-1 text-xs rounded-sm transition-colors",
            activeSlug === t.slug
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={activeSlug === t.slug}
        >
          {t.name}
        </button>
      ))}
    </div>
  );
}
