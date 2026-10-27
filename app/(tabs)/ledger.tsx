import { useMemo, useState } from "react";
import { StyleSheet, View, Text, TextInput, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, BookOpen } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { useShopData } from "@/lib/use-shop-data";
import { formatDate, formatINR } from "@/lib/format";
import { SegmentedControl } from "@/components/SegmentedControl";
import { EmptyState, ErrorBanner, ScreenLoading } from "@/components/StateViews";
import type { PartyType, Direction } from "@/lib/types";

type Filter = "all" | "customer" | "supplier" | "credit" | "debit";

export default function LedgerScreen() {
  const { entries, loading, error, reload } = useShopData();
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        if (filter === "customer" && e.party_type !== "customer") return false;
        if (filter === "supplier" && e.party_type !== "supplier") return false;
        if (filter === "credit" && e.direction !== "credit") return false;
        if (filter === "debit" && e.direction !== "debit") return false;
        const name = e.party?.name ?? "";
        const note = e.note ?? "";
        return (
          name.toLowerCase().includes(query.toLowerCase()) ||
          note.toLowerCase().includes(query.toLowerCase())
        );
      });
  }, [entries, filter, query]);

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  if (loading) return <ScreenLoading label="Loading ledger..." />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.forest} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>All entries</Text>
        <Text style={styles.subtitle}>{filtered.length} entries recorded</Text>

        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.searchWrap}>
          <Search color={theme.colors.gray} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by party or note..."
            placeholderTextColor={theme.colors.gray2}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <SegmentedControl<Filter>
            options={[
              { value: "all", label: "All" },
              { value: "customer", label: "Customer" },
              { value: "supplier", label: "Supplier" },
              { value: "credit", label: "Credit" },
              { value: "debit", label: "Debit" },
            ]}
            value={filter}
            onSelect={setFilter}
          />
        </ScrollView>

        {filtered.length === 0 ? (
          <EmptyState
            title="No entries found"
            subtitle="Adjust your search or filters, or add a new entry."
            icon={<BookOpen color={theme.colors.forest} size={28} />}
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((e) => {
              const isCustomer = e.party_type === "customer";
              const isCredit = e.direction === "credit";
              const increases = isCustomer ? !isCredit : isCredit;
              return (
                <View key={e.id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View
                      style={[
                        styles.dirDot,
                        { backgroundColor: increases ? theme.colors.error : theme.colors.green },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.partyName}>{e.party?.name ?? "Unknown"}</Text>
                      <Text style={styles.meta}>
                        {isCustomer ? "Customer" : "Supplier"} · {formatDate(e.transaction_date)}
                        {e.payment_mode !== "na" ? ` · ${e.payment_mode}` : ""}
                      </Text>
                      {e.note ? <Text style={styles.note}>{e.note}</Text> : null}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.amt,
                      { color: increases ? theme.colors.error : theme.colors.green },
                    ]}
                  >
                    {e.direction === "credit" ? "+" : "-"}
                    {formatINR(Number(e.amount))}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  filterRow: { marginBottom: 18 },
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
  dirDot: { width: 10, height: 10, borderRadius: 5 },
  partyName: { fontFamily: theme.fonts.bodyMed, fontSize: 15, color: theme.colors.nearBlack },
  meta: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray, marginTop: 2 },
  note: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray, marginTop: 2, fontStyle: "italic" },
  amt: { fontFamily: theme.fonts.display, fontSize: 16 },
});
