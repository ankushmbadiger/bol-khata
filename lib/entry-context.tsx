import { createContext, useContext, useState, type ReactNode } from "react";
import type { EntryDraft, PaymentMode, PartyType, Direction, EntrySource } from "./types";
import { todayISODate } from "./format";

function emptyDraft(source: EntrySource): EntryDraft {
  return {
    party_id: null,
    party_name: "",
    party_type: null,
    direction: null,
    amount: null,
    payment_mode: "na",
    note: "",
    transaction_date: todayISODate(),
    source,
    transcript: null,
  };
}

interface EntryContextValue {
  draft: EntryDraft;
  setDraft: (d: EntryDraft) => void;
  updateDraft: (patch: Partial<EntryDraft>) => void;
  resetDraft: (source: EntrySource) => void;
}

const EntryContext = createContext<EntryContextValue>({
  draft: emptyDraft("manual"),
  setDraft: () => {},
  updateDraft: () => {},
  resetDraft: () => {},
});

export function EntryProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<EntryDraft>(emptyDraft("manual"));

  function setDraft(d: EntryDraft) {
    setDraftState(d);
  }

  function updateDraft(patch: Partial<EntryDraft>) {
    setDraftState((prev) => ({ ...prev, ...patch }));
  }

  function resetDraft(source: EntrySource) {
    setDraftState(emptyDraft(source));
  }

  return (
    <EntryContext.Provider value={{ draft, setDraft, updateDraft, resetDraft }}>
      {children}
    </EntryContext.Provider>
  );
}

export function useEntryDraft() {
  return useContext(EntryContext);
}
