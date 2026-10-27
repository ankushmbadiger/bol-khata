import { useMemo, useState } from "react";
import { StyleSheet, View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart3, TrendingUp, TrendingDown, Wallet, ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { useShopData } from "@/lib/use-shop-data";
import { summarize } from "@/lib/ledger";
import { formatINR, formatDate } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { EmptyState, ErrorBanner, ScreenLoading } from "@/components/StateViews";

type Period = "today" | "7d" | "30d" | "all";

export default function ReportsScreen() {
  const { entries, loading, error, reload } = useShopData();
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("all");

  const filteredEntries = useMemo(() => {
    if (period === "all") return entries;
    const now = new Date();
    let cutoff = new Date();
    if (period === "today") cutoff = new Date(now.setHours(0, 0, 0, 0));
    else if (period === "7d") cutoff = new Date(now.getTime() - 7 * 86400000);
    else if (period === "30d") cutoff = new Date(now.getTime() - 30 * 86400000);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return entries.filter((e) => e.transaction_date >= cutoffStr);
  }, [entries, period]);

  const summary = useMemo(() => summarize(filteredEntries), [filteredEntries]);

  const netFlow = summary.totalPaymentsReceived - summary.totalPaymentsMade;

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  if (loading) return <ScreenLoading label="Loading reports..." />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.forest} />}
      >
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Summary of your recorded ledger activity</Text>

        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.periodRow}>
          {(["today", "7d", "30d", "all"] as Period[]).map((p) => (
            <View key={p} style={[styles.periodPill, period === p && styles.periodPillActive]}>
              <Text
                style={[styles.periodText, period === p && styles.periodTextActive]}
                onPress={() => setPeriod(p)}
              >
                {p === "today" ? "Today" : p === "7d" ? "7 days" : p === "30d" ? "30 days" : "All time"}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            These figures are based on entries you recorded in BolKhata, not verified bank balances.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIconWrap}>
            <Wallet color={theme.colors.lime} size={22} />
          </View>
          <Text style={styles.summaryLabel}>Net cash flow</Text>
          <Text style={[styles.summaryValue, { color: netFlow >= 0 ? theme.colors.green : theme.colors.error }]}>
            {netFlow >= 0 ? "+" : ""}
            {formatINR(netFlow)}
          </Text>
          <Text style={styles.summaryMeta}>Payments received minus payments made</Text>
        </View>

        <View style={styles.statsGrid}>
          <ReportTile
            label="Customer receivables"
            value={formatINR(summary.totalCustomerReceivable)}
            icon={<TrendingUp color={theme.colors.forest} size={18} />}
            bg={theme.colors.mint}
          />
          <ReportTile
            label="Supplier payables"
            value={formatINR(summary.totalSupplierPayable)}
            icon={<TrendingDown color={theme.colors.error} size={18} />}
            bg={theme.colors.errorSoft}
          />
        </View>
        <View style={styles.statsGrid}>
          <ReportTile
            label="Payments received"
            value={formatINR(summary.totalPaymentsReceived)}
            icon={<ArrowDownLeft color={theme.colors.green} size={18} />}
            bg={theme.colors.greenSoft}
          />
          <ReportTile
            label="Payments made"
            value={formatINR(summary.totalPaymentsMade)}
            icon={<ArrowUpRight color={theme.colors.gray} size={18} />}
            bg={theme.colors.grayLight}
          />
        </View>

        <Text style={styles.sectionTitle}>Entries this period</Text>
        {filteredEntries.length === 0 ? (
          <EmptyState
            title="No entries in this period"
            subtitle="Choose a different time range or record a new entry."
            icon={<BarChart3 color={theme.colors.forest} size={28} />}
          />
        ) : (
          <View style={styles.list}>
            {filteredEntries.slice(0, 20).map((e) => {
              const isCustomer = e.party_type === "customer";
              const isCredit = e.direction === "credit";
              const increases = isCustomer ? !isCredit : isCredit;
              return (
                <View key={e.id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.dirDot, { backgroundColor: increases ? theme.colors.error : theme.colors.green }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.partyName}>{e.party?.name ?? "Unknown"}</Text>
                      <Text style={styles.meta}>
                        {isCustomer ? "Customer" : "Supplier"} · {formatDate(e.transaction_date)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.amt, { color: increases ? theme.colors.error : theme.colors.green }]}>
                    {e.direction === "credit" ? "+" : "-"}
                    {formatINR(Number(e.amount))}
                  </Text>
                </View>
              );
            })}
            {filteredEntries.length > 20 ? (
              <Text style={styles.moreText}>Showing 20 of {filteredEntries.length} entries</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReportTile({ label, value, icon, bg }: { label: string; value: string; icon: React.ReactNode; bg: string }) {
  return (
    <View style={[styles.tile, { backgroundColor: bg }]}>
      {icon}
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.grayBg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  title: { fontFamily: theme.fonts.display, fontSize: 26, color: theme.colors.nearBlack },
  subtitle: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.gray, marginTop: 4, marginBottom: 18 },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  periodPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.white,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.colors.grayLight,
  },
  periodPillActive: { backgroundColor: theme.colors.nearBlack, borderColor: theme.colors.nearBlack },
  periodText: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.gray },
  periodTextActive: { color: theme.colors.white, fontFamily: theme.fonts.bodyBold },
  disclaimer: {
    backgroundColor: theme.colors.mint,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 18,
  },
  disclaimerText: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.forest },
  summaryCard: {
    backgroundColor: theme.colors.nearBlack,
    borderRadius: theme.radius.xl,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  summaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  summaryLabel: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.gray2 },
  summaryValue: { fontFamily: theme.fonts.display, fontSize: 34, marginTop: 4 },
  summaryMeta: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray2, marginTop: 8, textAlign: "center" },
  statsGrid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  tile: {
    flex: 1,
    borderRadius: theme.radius.lg,
    padding: 16,
    minHeight: 100,
    justifyContent: "flex-end",
  },
  tileLabel: { fontFamily: theme.fonts.bodyMed, fontSize: 12, color: theme.colors.gray, marginTop: 8 },
  tileValue: { fontFamily: theme.fonts.display, fontSize: 20, color: theme.colors.nearBlack, marginTop: 2 },
  sectionTitle: { fontFamily: theme.fonts.display, fontSize: 18, color: theme.colors.nearBlack, marginTop: 22, marginBottom: 12 },
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
  amt: { fontFamily: theme.fonts.display, fontSize: 16 },
  moreText: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray, textAlign: "center", marginTop: 10 },
});
