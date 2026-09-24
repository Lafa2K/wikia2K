import { useEffect, useRef } from "react";

const PREFIX = "gamebook-draft:";

export function draftKey(scope: string) {
  return `${PREFIX}${scope}`;
}

/** Salva um rascunho no localStorage ~1.2s depois da última alteração. */
export function useDraftAutosave<T>(scope: string, value: T, enabled: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(scope), JSON.stringify({ value, savedAt: Date.now() }));
      } catch {
        // localStorage cheio ou indisponível — autosave é conveniência, não crítico.
      }
    }, 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [scope, value, enabled]);
}

export function readDraft<T>(scope: string): { value: T; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(draftKey(scope));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft(scope: string) {
  try {
    localStorage.removeItem(draftKey(scope));
  } catch {
    // ignora
  }
}

/** Mostra o aviso nativo do navegador se o usuário tentar sair com alterações não salvas. */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
