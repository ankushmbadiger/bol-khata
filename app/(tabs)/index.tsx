import { useMemo, useState } from "react";
import { StyleSheet, View, Text, Pressable, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Mic, Plus, Users, Truck, BookOpen, ChevronRight } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { useShopData } from "@/lib/use-shop-data";
import { summarize } from "@/lib/ledger";
import { formatINR, formatDate } from "@/lib/format";
import { LANGUAGES } from "@/lib/types";
import { StatCard } from "@/components/StatCard";
import { EmptyState, ErrorBanner, ScreenLoading } from "@/components/StateViews";
import { Button } from "@/components/Button";

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { parties, entries, loading, error, reload } = useShopData();
  const [refreshing, setRefreshing] = useState(false);

  const summary = useMemo(() => summarize(entries), [entries]);
  const recent = useMemo(() => entries.slice(0, 6), [entries]);
  const langLabel = LANGUAGES.find((l) => l.code === profile?.preferred_language)?.label ?? "English";

  async function onRefresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  if (loading) return <ScreenLoading label="Loading your khata..." />;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.forest} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Namaste,</Text>
            <Text style={styles.shopName}>{profile?.shop_name ?? "My Shop"}</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/settings")}
            style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.avatarText}>
              {(profile?.shop_name ?? "S").charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        {/* Speak Entry card */}
        <Pressable
          onPress={() => router.push("/entry?mode=voice")}
          style={({ pressed }) => [styles.speakCard, pressed && { transform: [{ scale: 0.99 }] }]}
        >
          <View style={styles.speakTop}>
            <View>
              <Text style={styles.speakLabel}>Tap to record</Text>
              <Text style={styles.speakTitle}>Speak Entry</Text>
            </View>
            <View style={styles.micCircle}>
              <Mic color={theme.colors.nearBlack} size={34} strokeWidth={2.4} />
            </View>
          </View>
          <Text style={styles.speakLang}>Language: {langLabel}</Text>
        </Pressable>

        {/* Quick manual entry */}
        <View style={styles.quickRow}>
          <Button
            label="Manual entry"
            onPress={() => router.push("/entry?mode=manual")}
            variant="outline"
            icon={<Plus color={theme.colors.nearBlack} size={18} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            label="Customer dues"
            value={formatINR(summary.totalCustomerReceivable)}
            accent={theme.colors.forest}
            style={{ flex: 1, marginRight: 8 }}
          />
          <StatCard
            label="Supplier dues"
            value={formatINR(summary.totalSupplierPayable)}
            accent={theme.colors.lime}
            background={theme.colors.nearBlack}
            valueColor={theme.colors.lime}
            style={{ flex: 1 }}
          />
        </View>
        <View style={styles.statsGrid}>
          <StatCard
            label="Payments received"
            value={formatINR(summary.totalPaymentsReceived)}
            accent={theme.colors.green}
            style={{ flex: 1, marginRight: 8 }}
          />
          <StatCard
            label="Payments made"
            value={formatINR(summary.totalPaymentsMade)}
            accent={theme.colors.gray}
            style={{ flex: 1 }}
          />
        </View>
        <View style={{ marginBottom: 16 }}>
          <StatCard
            label="Entries recorded today"
            value={String(summary.todayEntryCount)}
            accent={theme.colors.lime}
            background={theme.colors.mint}
            style={{ flex: 1 }}
          />
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <QuickAction
            label="Customers"
            icon={<Users color={theme.colors.forest} size={22} strokeWidth={2} />}
            onPress={() => router.push("/(tabs)/parties?type=customer")}
          />
          <QuickAction
            label="Suppliers"
            icon={<Truck color={theme.colors.forest} size={22} strokeWidth={2} />}
            onPress={() => router.push("/(tabs)/parties?type=supplier")}
          />
          <QuickAction
            label="All ledger"
            icon={<BookOpen color={theme.colors.forest} size={22} strokeWidth={2} />}
            onPress={() => router.push("/(tabs)/ledger")}
          />
        </View>

        {/* Recent activity */}
        <Text style={styles.sectionTitle}>Recent activity</Text>
        {recent.length === 0 ? (
          <EmptyState
            title="No entries yet"
            subtitle="Tap Speak Entry or add manually to start your ledger."
            icon={<BookOpen color={theme.colors.forest} size={28} />}
          />
        ) : (
          <View style={styles.recentList}>
            {recent.map((e) => {
              const partyName = e.party?.name ?? "Unknown";
              const isCredit = e.direction === "credit";
              const isCustomer = e.party_type === "customer";
              const owesMore =
                (isCustomer && !isCredit) || (!isCustomer && isCredit);
              return (
                <View key={e.id} style={styles.recentItem}>
                  <View style={styles.recentLeft}>
                    <View
                      style={[
                        styles.dirDot,
                        { backgroundColor: owesMore ? theme.colors.error : theme.colors.green },
                      ]}
                    />
                    <View>
                      <Text style={styles.recentName}>{partyName}</Text>
                      <Text style={styles.recentMeta}>
                        {isCustomer ? "Customer" : "Supplier"} · {formatDate(e.transaction_date)}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.recentAmt,
                      { color: owesMore ? theme.colors.error : theme.colors.green },
                    ]}
                  >
                    {isCredit ? "+" : "-"}
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

function QuickAction({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
    >
      {icon}
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.grayBg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.gray },
  shopName: { fontFamily: theme.fonts.display, fontSize: 24, color: theme.colors.nearBlack },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.nearBlack,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: theme.fonts.display, fontSize: 18, color: theme.colors.lime },
  speakCard: {
    backgroundColor: theme.colors.lime,
    borderRadius: theme.radius.xl,
    padding: 24,
    marginBottom: 14,
    ...theme.shadow.card,
  },
  speakTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  speakLabel: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.nearBlack, opacity: 0.7 },
  speakTitle: { fontFamily: theme.fonts.display, fontSize: 28, color: theme.colors.nearBlack, marginTop: 2 },
  micCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.nearBlack,
    alignItems: "center",
    justifyContent: "center",
  },
  speakLang: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.nearBlack,
    opacity: 0.7,
    marginTop: 16,
  },
  quickRow: { flexDirection: "row", marginBottom: 18 },
  statsGrid: { flexDirection: "row", marginBottom: 12 },
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  quickAction: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    ...theme.shadow.soft,
  },
  quickActionLabel: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.nearBlack },
  sectionTitle: { fontFamily: theme.fonts.display, fontSize: 18, color: theme.colors.nearBlack, marginBottom: 12 },
  recentList: { gap: 8 },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  recentLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  dirDot: { width: 10, height: 10, borderRadius: 5 },
  recentName: { fontFamily: theme.fonts.bodyMed, fontSize: 15, color: theme.colors.nearBlack },
  recentMeta: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray, marginTop: 2 },
  recentAmt: { fontFamily: theme.fonts.display, fontSize: 16 },
});
