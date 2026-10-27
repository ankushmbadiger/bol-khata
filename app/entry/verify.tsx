import { useState } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Check, Edit3, AlertCircle, Mic, FileText, ChevronDown, ChevronUp } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { useEntryDraft } from "@/lib/entry-context";
import { useShopData } from "@/lib/use-shop-data";
import { supabase } from "@/lib/supabase";
import { validateEntry } from "@/lib/ledger";
import { formatINR, formatDate, randomIdempotencyKey } from "@/lib/format";
import { PAYMENT_MODES } from "@/lib/types";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/StateViews";

export default function VerifyScreen() {
  const router = useRouter();
  const { draft, resetDraft } = useEntryDraft();
  const { reload } = useShopData();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const validationError = validateEntry(draft.party_type, draft.direction, draft.amount, draft.payment_mode);
  const missingParty = !draft.party_id;
  const canConfirm = !validationError && !missingParty;

  const partyName = draft.party_name || "Not selected";
  const modeLabel = PAYMENT_MODES.find((m) => m.value === draft.payment_mode)?.label ?? "Not applicable";
  const directionLabel =
    draft.party_type === "supplier"
      ? draft.direction === "credit"
        ? "Credit purchase (you owe more)"
        : "Payment made (you owe less)"
      : draft.direction === "debit"
        ? "Credit sale (customer owes more)"
        : "Payment received (customer owes less)";

  async function handleConfirm() {
    setError(null);
    if (!canConfirm) {
      setError(validationError || "Select a party before saving.");
      return;
    }
    setSaving(true);
    const idempotencyKey = randomIdempotencyKey();

    const { data, error: insertError } = await supabase
      .from("entries")
      .insert({
        party_id: draft.party_id,
        party_type: draft.party_type,
        direction: draft.direction,
        amount: draft.amount,
        payment_mode: draft.payment_mode,
        note: draft.note || null,
        transaction_date: draft.transaction_date,
        source: draft.source,
        transcript: draft.transcript,
        status: "active",
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (insertError) {
      setSaving(false);
      setError(insertError.message);
      return;
    }

    // Write audit trail
    if (data) {
      await supabase.from("entry_revisions").insert({
        entry_id: data.id,
        action: "created",
        payload: data as any,
      });
    }

    await reload();
    setSaving(false);
    resetDraft("manual");

    Alert.alert("Entry saved", "The ledger entry has been recorded.", [
      { text: "OK", onPress: () => router.dismiss() },
    ]);
  }

  function handleEdit() {
    router.push("/entry/manual");
  }

  const missingFields: string[] = [];
  if (missingParty) missingFields.push("Party");
  if (!draft.direction) missingFields.push("Entry type");
  if (!draft.amount || draft.amount <= 0) missingFields.push("Amount");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={theme.colors.nearBlack} size={26} />
        </Pressable>
        <Text style={styles.headerTitle}>Review entry</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.instruction}>
          Please review the details below. This entry will be saved to your ledger once you confirm.
        </Text>

        {draft.source === "voice" && draft.transcript ? (
          <Pressable onPress={() => setShowTranscript(!showTranscript)} style={styles.transcriptCard}>
            <View style={styles.transcriptHeader}>
              <Mic color={theme.colors.forest} size={16} />
              <Text style={styles.transcriptLabel}>Original transcript</Text>
              {showTranscript ? <ChevronUp color={theme.colors.gray} size={16} /> : <ChevronDown color={theme.colors.gray} size={16} />}
            </View>
            {showTranscript ? <Text style={styles.transcriptText}>"{draft.transcript}"</Text> : null}
          </Pressable>
        ) : null}

        <View style={styles.summaryCard}>
          <SummaryRow label="Party" value={partyName} warning={missingParty} />
          <Divider />
          <SummaryRow label="Type" value={draft.party_type === "supplier" ? "Supplier / distributor" : draft.party_type === "customer" ? "Customer" : "Not selected"} warning={!draft.party_type} />
          <Divider />
          <SummaryRow label="Entry" value={directionLabel} warning={!draft.direction} />
          <Divider />
          <SummaryRow label="Amount" value={formatINR(draft.amount ?? 0)} warning={!draft.amount || draft.amount <= 0} big />
          <Divider />
          <SummaryRow label="Payment mode" value={modeLabel} />
          <Divider />
          <SummaryRow label="Date" value={formatDate(draft.transaction_date)} />
          {draft.note ? (
            <>
              <Divider />
              <SummaryRow label="Note" value={draft.note} />
            </>
          ) : null}
        </View>

        {missingFields.length > 0 ? (
          <View style={styles.warningBox}>
            <AlertCircle color={theme.colors.warning} size={18} />
            <Text style={styles.warningText}>
              Missing: {missingFields.join(", ")}. Tap "Make changes" to fix before saving.
            </Text>
          </View>
        ) : null}

        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.btnRow}>
          <Button
            label="Make changes"
            onPress={handleEdit}
            variant="outline"
            size="lg"
            style={{ flex: 1, marginRight: 10 }}
            icon={<Edit3 color={theme.colors.nearBlack} size={18} />}
          />
          <Button
            label="Confirm & save"
            onPress={handleConfirm}
            variant="lime"
            size="lg"
            loading={saving}
            disabled={!canConfirm}
            style={{ flex: 1 }}
            icon={<Check color={theme.colors.nearBlack} size={18} />}
          />
        </View>

        <Text style={styles.conventionNote}>
          {draft.party_type === "supplier"
            ? "Supplier: credit purchase increases what you owe, payment made decreases it."
            : draft.party_type === "customer"
              ? "Customer: credit sale increases what they owe, payment received decreases it."
              : ""}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, warning, big }: { label: string; value: string; warning?: boolean; big?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          big && styles.summaryValueBig,
          warning && { color: theme.colors.error },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.grayBg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.white,
  },
  headerTitle: { fontFamily: theme.fonts.display, fontSize: 20, color: theme.colors.nearBlack },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },
  instruction: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.gray, marginBottom: 16 },
  transcriptCard: {
    backgroundColor: theme.colors.mint,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  transcriptHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  transcriptLabel: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.forest, flex: 1 },
  transcriptText: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.nearBlack, marginTop: 10, fontStyle: "italic" },
  summaryCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 20,
    ...theme.shadow.card,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  summaryLabel: { fontFamily: theme.fonts.bodyMed, fontSize: 14, color: theme.colors.gray },
  summaryValue: { fontFamily: theme.fonts.bodyMed, fontSize: 15, color: theme.colors.nearBlack, textAlign: "right", flex: 1, marginLeft: 16 },
  summaryValueBig: { fontFamily: theme.fonts.display, fontSize: 24, color: theme.colors.forest },
  divider: { height: 1, backgroundColor: theme.colors.grayLight },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF6E5",
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  warningText: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.warning, flex: 1 },
  btnRow: { flexDirection: "row", marginTop: 24 },
  conventionNote: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray, marginTop: 16, textAlign: "center" },
});
