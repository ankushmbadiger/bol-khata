import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Search, Plus, X } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { useShopData } from "@/lib/use-shop-data";
import { useEntryDraft } from "@/lib/entry-context";
import { supabase } from "@/lib/supabase";
import { validateEntry } from "@/lib/ledger";
import { formatINR, todayISODate } from "@/lib/format";
import { PAYMENT_MODES, type PartyType, type Direction, type PaymentMode } from "@/lib/types";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/StateViews";

export default function ManualEntryScreen() {
  const router = useRouter();
  const { partyId } = useLocalSearchParams<{ partyId?: string }>();
  const { parties, reload } = useShopData();
  const { draft, updateDraft, resetDraft } = useEntryDraft();

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNewParty, setShowNewParty] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // If a partyId was passed (from the party detail screen), preselect it.
  useEffect(() => {
    if (partyId) {
      const p = parties.find((pp) => pp.id === partyId);
      if (p) {
        updateDraft({ party_id: p.id, party_name: p.name, party_type: p.party_type });
      }
    }
  }, [partyId, parties]);

  const filteredParties = useMemo(() => {
    if (!draft.party_type) return parties;
    return parties.filter((p) => p.party_type === draft.party_type);
  }, [parties, draft.party_type]);

  const searchedParties = filteredParties.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  async function handleCreateParty() {
    if (!newPartyName.trim() || !draft.party_type) return;
    const { data, error: insertError } = await supabase
      .from("parties")
      .insert({
        name: newPartyName.trim(),
        party_type: draft.party_type,
      })
      .select()
      .single();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    await reload();
    updateDraft({ party_id: data.id, party_name: data.name, party_type: data.party_type });
    setShowNewParty(false);
    setNewPartyName("");
  }

  function handleContinue() {
    setError(null);
    const validationError = validateEntry(draft.party_type, draft.direction, draft.amount, draft.payment_mode);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!draft.party_id) {
      setError("Select a party or create a new one.");
      return;
    }
    router.push("/entry/verify");
  }

  const selectedParty = parties.find((p) => p.id === draft.party_id);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.dismiss()} hitSlop={12}>
            <ChevronLeft color={theme.colors.nearBlack} size={26} />
          </Pressable>
          <Text style={styles.headerTitle}>Manual entry</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Party type */}
          <Text style={styles.label}>Account type</Text>
          <SegmentedControl<PartyType>
            options={[
              { value: "customer", label: "Customer" },
              { value: "supplier", label: "Supplier" },
            ]}
            value={draft.party_type}
            onSelect={(v) => updateDraft({ party_type: v, party_id: null, party_name: "" })}
          />

          {/* Party selection */}
          <Text style={styles.label}>Party</Text>
          {selectedParty ? (
            <View style={styles.selectedParty}>
              <View style={styles.selectedPartyLeft}>
                <View style={styles.initialCircle}>
                  <Text style={styles.initialText}>{selectedParty.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.selectedName}>{selectedParty.name}</Text>
                  <Text style={styles.selectedMeta}>
                    {selectedParty.party_type === "customer" ? "Customer" : "Supplier"}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => updateDraft({ party_id: null, party_name: "" })}>
                <X color={theme.colors.gray} size={20} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.partySearchArea}>
              <View style={styles.searchWrap}>
                <Search color={theme.colors.gray} size={18} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search existing parties..."
                  placeholderTextColor={theme.colors.gray2}
                  style={styles.searchInput}
                />
              </View>
              {searchedParties.slice(0, 5).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => updateDraft({ party_id: p.id, party_name: p.name, party_type: p.party_type })}
                  style={({ pressed }) => [styles.partySuggestion, pressed && { opacity: 0.6 }]}
                >
                  <View style={styles.suggestionLeft}>
                    <Text style={styles.suggestionName}>{p.name}</Text>
                    <Text style={styles.suggestionMeta}>{p.party_type === "customer" ? "Customer" : "Supplier"}</Text>
                  </View>
                </Pressable>
              ))}
              {searchedParties.length === 0 && searchQuery.length > 0 ? (
                <Text style={styles.noMatchText}>No matches. Create a new party below.</Text>
              ) : null}
              <Pressable
                onPress={() => setShowNewParty(true)}
                style={({ pressed }) => [styles.newPartyBtn, pressed && { opacity: 0.7 }]}
              >
                <Plus color={theme.colors.forest} size={18} />
                <Text style={styles.newPartyText}>Create new {draft.party_type ?? "party"}</Text>
              </Pressable>
            </View>
          )}

          {/* Direction */}
          <Text style={styles.label}>Entry type</Text>
          <SegmentedControl<Direction>
            options={[
              { value: "debit", label: draft.party_type === "supplier" ? "Payment made" : "Credit sale" },
              { value: "credit", label: draft.party_type === "supplier" ? "Credit purchase" : "Payment received" },
            ]}
            value={draft.direction}
            onSelect={(v) => updateDraft({ direction: v })}
          />
          <Text style={styles.hint}>
            {draft.party_type === "supplier"
              ? "Credit purchase = you owe more. Payment made = you owe less."
              : draft.party_type === "customer"
                ? "Credit sale = customer owes more. Payment received = customer owes less."
                : "Select an account type first."}
          </Text>

          {/* Amount */}
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            value={draft.amount !== null ? String(draft.amount) : ""}
            onChangeText={(v) => updateDraft({ amount: v ? parseFloat(v) : null })}
            placeholder="0"
            placeholderTextColor={theme.colors.gray2}
            keyboardType="numeric"
            style={styles.amountInput}
          />
          {draft.amount !== null && draft.amount > 0 ? (
            <Text style={styles.amountPreview}>{formatINR(draft.amount)}</Text>
          ) : null}

          {/* Payment mode */}
          <Text style={styles.label}>Payment mode</Text>
          <View style={styles.modeGrid}>
            {PAYMENT_MODES.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => updateDraft({ payment_mode: m.value })}
                style={[styles.modePill, draft.payment_mode === m.value && styles.modePillActive]}
              >
                <Text style={[styles.modeText, draft.payment_mode === m.value && styles.modeTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Note */}
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            value={draft.note}
            onChangeText={(v) => updateDraft({ note: v })}
            placeholder="Add a note..."
            placeholderTextColor={theme.colors.gray2}
            multiline
            style={styles.noteInput}
          />

          {/* Date */}
          <Text style={styles.label}>Transaction date</Text>
          <TextInput
            value={draft.transaction_date}
            onChangeText={(v) => updateDraft({ transaction_date: v })}
            placeholder="YYYY-MM-DD"
            style={styles.dateInput}
          />

          {error ? <ErrorBanner message={error} /> : null}

          <Button label="Review entry" onPress={handleContinue} size="lg" style={{ marginTop: 8 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* New party modal */}
      {showNewParty ? (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New {draft.party_type ?? "party"}</Text>
            <TextInput
              value={newPartyName}
              onChangeText={setNewPartyName}
              placeholder="Party name"
              placeholderTextColor={theme.colors.gray2}
              style={styles.modalInput}
              autoFocus
            />
            <View style={styles.modalBtns}>
              <Button label="Cancel" onPress={() => setShowNewParty(false)} variant="ghost" style={{ flex: 1, marginRight: 8 }} />
              <Button label="Add" onPress={handleCreateParty} variant="lime" style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontFamily: theme.fonts.display, fontSize: 20, color: theme.colors.nearBlack },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.gray, marginBottom: 8, marginTop: 16 },
  hint: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray2, marginTop: 8, marginBottom: 4 },
  selectedParty: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.mint,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectedPartyLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  initialCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  initialText: { fontFamily: theme.fonts.display, fontSize: 16, color: theme.colors.forest },
  selectedName: { fontFamily: theme.fonts.bodyBold, fontSize: 15, color: theme.colors.nearBlack },
  selectedMeta: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.forest, marginTop: 2 },
  partySearchArea: { gap: 6 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    borderColor: theme.colors.grayLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: { flex: 1, fontFamily: theme.fonts.body, fontSize: 15, color: theme.colors.nearBlack },
  partySuggestion: {
    backgroundColor: theme.colors.grayBg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionLeft: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  suggestionName: { fontFamily: theme.fonts.bodyMed, fontSize: 14, color: theme.colors.nearBlack },
  suggestionMeta: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray },
  noMatchText: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray, paddingHorizontal: 4, paddingVertical: 6 },
  newPartyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.mint,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  newPartyText: { fontFamily: theme.fonts.bodyMed, fontSize: 14, color: theme.colors.forest },
  amountInput: {
    borderWidth: 1.5,
    borderColor: theme.colors.grayLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontFamily: theme.fonts.display,
    color: theme.colors.nearBlack,
  },
  amountPreview: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.forest, marginTop: 6 },
  modeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.grayBg,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  modePillActive: { backgroundColor: theme.colors.nearBlack, borderColor: theme.colors.nearBlack },
  modeText: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.gray },
  modeTextActive: { color: theme.colors.white, fontFamily: theme.fonts.bodyBold },
  noteInput: {
    borderWidth: 1.5,
    borderColor: theme.colors.grayLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: theme.fonts.body,
    color: theme.colors.nearBlack,
    minHeight: 60,
  },
  dateInput: {
    borderWidth: 1.5,
    borderColor: theme.colors.grayLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: theme.fonts.body,
    color: theme.colors.nearBlack,
  },
  modalOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    padding: 24,
    width: "100%",
  },
  modalTitle: { fontFamily: theme.fonts.display, fontSize: 20, color: theme.colors.nearBlack, marginBottom: 16 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: theme.colors.grayLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.nearBlack,
    marginBottom: 16,
  },
  modalBtns: { flexDirection: "row" },
});
