import { useMemo, useState } from "react";
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, RefreshControl } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Plus, Users, Truck, ChevronRight } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { useShopData } from "@/lib/use-shop-data";
import { partyOutstanding } from "@/lib/ledger";
import { formatINR } from "@/lib/format";
import type { Party, PartyType } from "@/lib/types";
import { SegmentedControl } from "@/components/SegmentedControl";
import { EmptyState, ErrorBanner, ScreenLoading } from "@/components/StateViews";

export default function PartiesScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const router = useRouter();
  const { parties, entries, loading, error, reload } = useShopData();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PartyType>(
    params.type === "supplier" ? "supplier" : "customer",
  );

  const filtered = useMemo(() => {
    return parties
      .filter((p) => p.party_type === filter)
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .map((p) => ({
        ...p,
        outstanding: partyOutstanding(
          p.party_type,
          entries.filter((e) => e.party_id === p.id),
        ),
      }))
      .sort((a, b) => Math.abs(b.outstanding) - Math.abs(a.outstanding));
  }, [parties, entries, filter, query]);

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  if (loading) return <ScreenLoading label="Loading parties..." />;

  const totalDue = filtered.reduce((sum, p) => sum + Math.max(0, p.outstanding), 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.forest} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Parties</Text>
        <Text style={styles.subtitle}>
          {filter === "customer" ? "Customers" : "Suppliers & distributors"} · total due{" "}
          {formatINR(totalDue)}
        </Text>

        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.searchWrap}>
          <Search color={theme.colors.gray} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search ${filter === "customer" ? "customers" : "suppliers"}...`}
            placeholderTextColor={theme.colors.gray2}
            style={styles.searchInput}
          />
        </View>

        <SegmentedControl<PartyType>
          options={[
            { value: "customer", label: "Customers" },
            { value: "supplier", label: "Suppliers" },
          ]}
          value={filter}
          onSelect={setFilter}
        />

        <Pressable
          onPress={() => router.push(`/party-form?type=${filter}`)}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
        >
          {filter === "customer" ? (
            <Users color={theme.colors.forest} size={18} />
          ) : (
            <Truck color={theme.colors.forest} size={18} />
          )}
          <Text style={styles.addBtnText}>Add new {filter}</Text>
          <Plus color={theme.colors.gray} size={18} style={{ marginLeft: "auto" }} />
        </Pressable>

        {filtered.length === 0 ? (
          <EmptyState
            title={`No ${filter === "customer" ? "customers" : "suppliers"} yet`}
            subtitle="Add a party to start tracking their account."
            icon={filter === "customer" ? <Users color={theme.colors.forest} size={28} /> : <Truck color={theme.colors.forest} size={28} />}
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((p) => (
              <PartyRow key={p.id} party={p} onPress={() => router.push(`/party/${p.id}`)} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PartyRow({ party, onPress }: { party: Party & { outstanding: number }; onPress: () => void }) {
  const owes = party.outstanding > 0;
  const zero = Math.abs(party.outstanding) < 0.01;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.initialCircle,
            { backgroundColor: party.party_type === "customer" ? theme.colors.mint : theme.colors.limeSoft },
          ]}
        >
          <Text style={styles.initialText}>{party.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.partyName}>{party.name}</Text>
          <Text style={styles.partyMeta}>
            {party.party_type === "customer" ? "Customer" : "Supplier"}
            {party.phone ? ` · ${party.phone}` : ""}
          </Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text
          style={[
            styles.amt,
            zero
              ? { color: theme.colors.gray }
              : owes
                ? { color: theme.colors.error }
                : { color: theme.colors.green },
          ]}
        >
          {zero ? "Settled" : formatINR(party.outstanding)}
        </Text>
        <ChevronRight color={theme.colors.gray2} size={18} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.grayBg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  title: { fontFamily: theme.fonts.display, fontSize: 26, color: theme.colors.nearBlack },
  subtitle: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.gray, marginTop: 4, marginBottom: 18 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontFamily: theme.fonts.body, fontSize: 15, color: theme.colors.nearBlack },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 14,
    marginBottom: 18,
    ...theme.shadow.soft,
  },
  addBtnText: { fontFamily: theme.fonts.bodyMed, fontSize: 15, color: theme.colors.forest },
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  initialCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  initialText: { fontFamily: theme.fonts.display, fontSize: 16, color: theme.colors.nearBlack },
  partyName: { fontFamily: theme.fonts.bodyMed, fontSize: 15, color: theme.colors.nearBlack },
  partyMeta: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray, marginTop: 2 },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  amt: { fontFamily: theme.fonts.display, fontSize: 15 },
});
