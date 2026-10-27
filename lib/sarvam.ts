import { supabase } from "./supabase";

export interface SarvamResult {
  transcript: string;
  source: "sarvam" | "mock";
  mock?: boolean;
  message?: string;
}

/**
 * Send a base64-encoded audio clip to the Sarvam AI proxy edge function.
 * The edge function holds the SARVAM_API_KEY server-side; the app never sees it.
 */
export async function transcribeAudio(audioBase64: string, language: string): Promise<SarvamResult> {
  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sarvam-proxy`;
  const sessionRes = await supabase.auth.getSession();
  const token = sessionRes.data.session?.access_token;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({ audio: audioBase64, language, mime: "audio/webm" }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody?.error || `Voice processing failed (${response.status})`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return {
    transcript: data.transcript || "",
    source: data.source || "mock",
    mock: data.mock,
    message: data.message,
  };
}

/**
 * Parse a free-text transcript into a structured entry draft.
 * This is a lightweight extraction layer — it looks for amounts, party names,
 * and keywords like "udhaar" (credit), "payment" / "paisa diya" (payment),
 * "customer" / "supplier", etc. When something can't be determined, it returns
 * null for that field so the verification screen asks the user.
 */
export interface ParsedDraft {
  party_name: string;
  party_type: "customer" | "supplier" | null;
  direction: "credit" | "debit" | null;
  amount: number | null;
  payment_mode: string;
  note: string;
}

export function parseTranscript(transcript: string): ParsedDraft {
  const text = transcript.toLowerCase().trim();
  const result: ParsedDraft = {
    party_name: "",
    party_type: null,
    direction: null,
    amount: null,
    payment_mode: "na",
    note: transcript,
  };

  // Amount: look for numbers, optionally with "rupees"/"rupye"/"rs"
  const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1]);
  }

  // Direction keywords
  // Credit sale / udhaar diya / lena = customer owes more (debit for customer)
  // Payment received / paisa mila / aa gaya = credit for customer
  // Payment made / diya / bheja = debit for supplier
  if (/udhaar|lena|credit sale|becha|sold/.test(text)) {
    result.direction = "debit";
    result.party_type = "customer";
  } else if (/payment mila|paisa mila|aa gaya|received|vasooli/.test(text)) {
    result.direction = "credit";
    result.party_type = "customer";
  } else if (/diya|bheja|payment kiya|chukta/.test(text)) {
    result.direction = "debit";
    result.party_type = "supplier";
  } else if (/supplier se|distributor se|kharida|purchase/.test(text)) {
    result.direction = "credit";
    result.party_type = "supplier";
  }

  // Payment mode
  if (/cash|nagad/.test(text)) result.payment_mode = "cash";
  else if (/upi|google pay|phonepe|paytm/.test(text)) result.payment_mode = "upi";
  else if (/bank|transfer|imps|neft/.test(text)) result.payment_mode = "bank";
  else if (/cheque|check/.test(text)) result.payment_mode = "cheque";

  // Party name: try to extract a name-like word before the amount
  // This is intentionally conservative — it won't guess if unclear.
  const words = transcript.trim().split(/\s+/);
  // Look for a capitalized word that isn't a keyword
  const keywords = new Set(["rupees", "rupye", "rs", "udhaar", "payment", "cash", "upi", "diya", "mila", "ko", "se", "ne", "ka", "ki", "se", "the", "a", "an"]);
  const nameWords = words.filter((w) => {
    const lower = w.toLowerCase();
    return lower.length > 1 && /^[A-Z]/.test(w) && !keywords.has(lower) && !/^\d/.test(w);
  });
  if (nameWords.length > 0) {
    result.party_name = nameWords.slice(0, 2).join(" ");
  }

  return result;
}
