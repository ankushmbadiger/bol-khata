import type { Entry, PartyType, Direction } from "./types";

/**
 * Compute the outstanding balance for a party from its entries.
 *
 * Ledger convention (shopkeeper's perspective):
 * - CUSTOMER (receivable = money owed TO the shopkeeper):
 *   - debit  = sale on credit -> customer owes MORE  (increases receivable)
 *   - credit = payment received -> customer owes LESS (decreases receivable)
 *   - outstanding = sum(debits) - sum(credits)  (positive = customer owes us)
 * - SUPPLIER/distributor (payable = money the shopkeeper owes):
 *   - credit = credit purchase -> we owe MORE  (increases payable)
 *   - debit  = payment made    -> we owe LESS (decreases payable)
 *   - outstanding = sum(credits) - sum(debits) (positive = we owe supplier)
 *
 * Only 'active' entries count. 'reversed' entries are ignored.
 */
export function partyOutstanding(partyType: PartyType, entries: Entry[]): number {
  let debits = 0;
  let credits = 0;
  for (const e of entries) {
    if (e.status !== "active") continue;
    if (e.direction === "debit") debits += Number(e.amount);
    else credits += Number(e.amount);
  }
  if (partyType === "customer") {
    return debits - credits;
  }
  return credits - debits;
}

/**
 * Running balance after each entry in chronological order.
 * Positive = party owes shopkeeper (for customer) / shopkeeper owes party (for supplier).
 */
export function runningBalances(
  partyType: PartyType,
  entries: Entry[],
): { entry: Entry; balance: number }[] {
  const sorted = [...entries].sort(
    (a, b) =>
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime() ||
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  let balance = 0;
  return sorted.map((entry) => {
    const amount = Number(entry.amount);
    if (entry.status !== "active") {
      return { entry, balance };
    }
    if (partyType === "customer") {
      balance += entry.direction === "debit" ? amount : -amount;
    } else {
      balance += entry.direction === "credit" ? amount : -amount;
    }
    return { entry, balance };
  });
}

export interface LedgerSummary {
  totalCustomerReceivable: number;
  totalSupplierPayable: number;
  totalPaymentsReceived: number;
  totalPaymentsMade: number;
  todayEntryCount: number;
}

export function summarize(entries: Entry[]): LedgerSummary {
  let totalCustomerReceivable = 0;
  let totalSupplierPayable = 0;
  let totalPaymentsReceived = 0;
  let totalPaymentsMade = 0;
  let todayEntryCount = 0;

  const today = new Date().toISOString().slice(0, 10);

  for (const e of entries) {
    if (e.status !== "active") continue;
    const amt = Number(e.amount);
    if (e.transaction_date === today) todayEntryCount += 1;

    if (e.party_type === "customer") {
      if (e.direction === "debit") totalCustomerReceivable += amt;
      else totalPaymentsReceived += amt;
    } else {
      if (e.direction === "credit") totalSupplierPayable += amt;
      else totalPaymentsMade += amt;
    }
  }

  return {
    totalCustomerReceivable,
    totalSupplierPayable,
    totalPaymentsReceived,
    totalPaymentsMade,
    todayEntryCount,
  };
}

/**
 * Validate that the entry direction is consistent with the party type and
 * whether a payment mode is required. Returns an error message or null.
 *
 * - A 'debit' for a customer = credit sale (no payment mode needed, na is fine)
 * - A 'credit' for a customer = payment received (payment mode recommended)
 * - A 'credit' for a supplier = credit purchase (no payment mode needed)
 * - A 'debit' for a supplier = payment made (payment mode recommended)
 */
export function validateEntry(
  partyType: PartyType | null,
  direction: Direction | null,
  amount: number | null,
  paymentMode: string,
): string | null {
  if (!partyType) return "Select whether this is a customer or supplier.";
  if (!direction) return "Select credit or debit.";
  if (amount === null || isNaN(amount) || amount <= 0)
    return "Enter an amount greater than zero.";
  // Payment mode 'na' is only valid for credit-sale / credit-purchase directions.
  const isPaymentFlow =
    (partyType === "customer" && direction === "credit") ||
    (partyType === "supplier" && direction === "debit");
  if (isPaymentFlow && paymentMode === "na") {
    return "Select a payment mode for a payment entry, or choose Not applicable only if unknown.";
  }
  return null;
}
