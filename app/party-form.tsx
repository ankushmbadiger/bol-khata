import { useState } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { FormField } from "@/components/FormField";
import { SegmentedControl } from "@/components/SegmentedControl";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/StateViews";
import type { PartyType } from "@/lib/types";

export default function PartyFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const [name, setName] = useState("");
  const [partyType, setPartyType] = useState<PartyType>(
    params.type === "supplier" ? "supplier" : "customer",
  );
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError("Enter the party name.");
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from("parties").insert({
      name: name.trim(),
      party_type: partyType,
      phone: phone.trim() || null,
      note: note.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={theme.colors.nearBlack} size={26} />
        </Pressable>
        <Text style={styles.headerTitle}>Add party</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>Party type</Text>
        <SegmentedControl<PartyType>
          options={[
            { value: "customer", label: "Customer" },
            { value: "supplier", label: "Supplier" },
          ]}
          value={partyType}
          onSelect={setPartyType}
        />

        <View style={{ height: 16 }} />

        <FormField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Ramesh Kumar"
          autoCapitalize="words"
        />
        <FormField
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          placeholder="98XXXXXXXX"
          keyboardType="phone-pad"
        />
        <FormField
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Any extra detail"
          autoCapitalize="sentences"
        />

        {error ? <ErrorBanner message={error} /> : null}

        <Button label="Save party" onPress={handleSave} loading={saving} size="lg" />
      </ScrollView>
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
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  label: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.gray, marginBottom: 8, marginTop: 6 },
});
