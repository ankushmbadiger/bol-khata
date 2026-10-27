import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Party, Entry } from "./types";

export function useShopData() {
  const [parties, setParties] = useState<Party[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [pRes, eRes] = await Promise.all([
      supabase.from("parties").select("*").order("name"),
      supabase
        .from("entries")
        .select("*, party:parties(*)")
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);
    if (pRes.error) setError(pRes.error.message);
    else if (eRes.error) setError(eRes.error.message);
    setParties((pRes.data as Party[]) ?? []);
    setEntries((eRes.data as Entry[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { parties, entries, loading, error, reload: load };
}
