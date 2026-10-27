export type PartyType = "customer" | "supplier";
export type Direction = "credit" | "debit";
export type PaymentMode = "cash" | "upi" | "bank" | "cheque" | "other" | "na";
export type EntrySource = "voice" | "manual";
export type EntryStatus = "active" | "reversed";

export interface Profile {
  id: string;
  shop_name: string;
  owner_name: string | null;
  phone: string | null;
  preferred_language: string;
  created_at: string;
}

export interface Party {
  id: string;
  user_id: string;
  name: string;
  party_type: PartyType;
  phone: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  party_id: string;
  party_type: PartyType;
  direction: Direction;
  amount: number;
  payment_mode: PaymentMode;
  note: string | null;
  transaction_date: string;
  source: EntrySource;
  transcript: string | null;
  status: EntryStatus;
  idempotency_key: string;
  created_at: string;
  party?: Party;
}

export interface EntryDraft {
  party_id: string | null;
  party_name: string;
  party_type: PartyType | null;
  direction: Direction | null;
  amount: number | null;
  payment_mode: PaymentMode;
  note: string;
  transaction_date: string;
  source: EntrySource;
  transcript: string | null;
}

export const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank", label: "Bank" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
  { value: "na", label: "Not applicable" },
];

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "हिन्दी (Hindi)" },
  { code: "bn-IN", label: "বাংলা (Bengali)" },
  { code: "kn-IN", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ta-IN", label: "தமிழ் (Tamil)" },
  { code: "te-IN", label: "తెలుగు (Telugu)" },
  { code: "mr-IN", label: "मराठी (Marathi)" },
  { code: "gu-IN", label: "ગુજરાતી (Gujarati)" },
  { code: "ml-IN", label: "മലയാളം (Malayalam)" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "od-IN", label: "ଓଡ଼ିଆ (Odia)" },
];
