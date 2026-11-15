// components/CompareProvider.tsx — in-memory compare tray (spec §6.1; FR-CMP-01)
// No cookies, no localStorage. React context only.
"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { COPY } from "@/lib/copy";

const MAX = 4;

type CompareContextValue = {
  ids: string[];
  add: (id: string) => { ok: boolean; message?: string };
  remove: (id: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue>({
  ids: [],
  add: () => ({ ok: false }),
  remove: () => {},
  clear: () => {},
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  const add = useCallback((id: string): { ok: boolean; message?: string } => {
    if (ids.includes(id)) return { ok: true }; // already in tray
    if (ids.length >= MAX) {
      return { ok: false, message: COPY["compare.max"] };
    }
    setIds((prev) => [...prev, id]);
    return { ok: true };
  }, [ids]);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  return (
    <CompareContext.Provider value={{ ids, add, remove, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
