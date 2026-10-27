import { useMemo, useState } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Plus, Phone } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { useShopData } from "@/lib/use-shop-data";
import { partyOutstanding, runningBalances } from "@/lib/ledger";
import { formatINR, formatDate } from "@/lib/format";
import { EmptyState, ErrorBanner, ScreenLoading } from "@/components/StateViews";
import { Button } from "@/components/Button";

export default function PartyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { parties, entries, loading, error, reload } = useShopData();
  const [refreshing, setRefreshing] = useState(false);

  const party = useMemo(() => parties.find((p) => p.id === id), [parties, id]);
  const partyEntries = useMemo(
    () => entries.filter((e) => e.party_id === id),
    [entries, id],
  );
  const outstanding = useMemo(
    () => (party ? partyOutstanding(party.party_type, partyEntries) : 0),
    [party, partyEntries],
  );
  const withBalances = useMemo(
    () => (party ? runningBalances(party.party_type, partyEntries) : []),
    [party, partyEntries],
  );

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  if (loading) return <ScreenLoading label="Loading account..." />;

  if (!party) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft color={theme.colors.nearBlack} size={26} />
          </Pressable>
        </View>
        <EmptyState title="Party not found" subtitle="This account may have been removed." />
      </SafeAreaView>
    );
  }

  const isCustomer = party.party_type === "customer";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color={theme.colors.nearBlack} size={26} />
        </Pressable>
        <Text style={styles.headerTitle}>{party.name}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.forest} />}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            {isCustomer ? "Customer owes you" : "You owe supplier"}
          </Text>
          <Text
            style={[
              styles.balanceValue,
              { color: outstanding > 0 ? theme.colors.nearBlack : theme.colors.green },
            ]}
          >
            {formatINR(Math.abs(outstanding))}
          </Text>
          <Text style={styles.balanceMeta}>
            {isCustomer ? "Customer account" : "Supplier / distributor account"}
            {party.phone ? ` · ${party.phone}` : ""}
          </Text>
          {party.phone ? (
            <Pressable style={styles.callBtn} onPress={() => {}}>
              <Phone color={theme.colors.forest} size={15} />
              <Text style={styles.callText}>Call</Text>
            </Pressable>
          ) : null}
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Account history</Text>
          <Text style={styles.sectionMeta}>{partyEntries.length} entries</Text>
        </View>

        {withBalances.length === 0 ? (
          <EmptyState
            title="No entries yet"
            subtitle="Record a credit sale or payment to start this ledger."
            icon={<Plus color={theme.colors.forest} size={26} />}
          />
        ) : (
          <View style={styles.ledger}>
            {withBalances
              .slice()
              .reverse()
              .map(({ entry, balance }) => {
                const isCredit = entry.direction === "credit";
                const increases = isCustomer ? !isCredit : isCredit;
                return (
                  <View key={entry.id} style={styles.ledgerItem}>
                    <View style={styles.ledgerLeft}>
                      <View
                        style={[
                          styles.tag,
                          {
                            backgroundColor: increases ? theme.colors.errorSoft : theme.colors.greenSoft,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            { color: increases ? theme.colors.error : theme.colors.forest },
                          ]}
                        >
                          {entry.direction === "debit" ? "DEBIT" : "CREDIT"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ledgerDesc}>
                          {entry.note || (entry.payment_mode !== "na" ? toTitle(entry.payment_mode) : "Ledger entry")}
                        </Text>
                        <Text style={styles.ledgerDate}>
                          {formatDate(entry.transaction_date)}
                          {entry.status === "reversed" ? " · REVERSED" : ""}
                          {entry.source === "voice" ? " · Voice" : " · Manual"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.ledgerRight}>
                      <Text
                        style={[
                          styles.ledgerAmt,
                          { color: increases ? theme.colors.error : theme.colors.green },
                        ]}
                      >
                        {formatINR(Number(entry.amount))}
                      </Text>
                      <Text style={styles.ledgerBal}>Bal {formatINR(balance)}</Text>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        <View style={{ height: 16 }} />
        <Button
          label="Add entry for this party"
          onPress={() => router.push(`/entry?mode=manual&partyId=${party.id}`)}
          variant="lime"
          size="lg"
          icon={<Plus color={theme.colors.nearBlack} size={18} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function toTitle(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  content: { paddingHorizontal: 20, paddingBottom: 32 },
  balanceCard: {
    backgroundColor: theme.colors.nearBlack,
    borderRadius: theme.radius.xl,
    padding: 24,
    marginBottom: 22,
    alignItems: "center",
  },
  balanceLabel: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.gray2 },
  balanceValue: { fontFamily: theme.fonts.display, fontSize: 36, color: theme.colors.lime, marginTop: 6 },
  balanceMeta: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray2, marginTop: 8, textAlign: "center" },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 14,
  },
  callText: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.forest },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 },
  sectionTitle: { fontFamily: theme.fonts.display, fontSize: 18, color: theme.colors.nearBlack },
  sectionMeta: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray },
  ledger: { gap: 8 },
  ledgerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  ledgerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontFamily: theme.fonts.bodyBold, fontSize: 10 },
  ledgerDesc: { fontFamily: theme.fonts.bodyMed, fontSize: 14, color: theme.colors.nearBlack },
  ledgerDate: { fontFamily: theme.fonts.body, fontSize: 11, color: theme.colors.gray, marginTop: 2 },
  ledgerRight: { alignItems: "flex-end" },
  ledgerAmt: { fontFamily: theme.fonts.display, fontSize: 15 },
  ledgerBal: { fontFamily: theme.fonts.body, fontSize: 11, color: theme.colors.gray, marginTop: 2 },
});
