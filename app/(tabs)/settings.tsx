import { useState } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, LogOut, Mic, Globe, Store, User, Phone, Info } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { LANGUAGES } from "@/lib/types";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { ErrorBanner } from "@/components/StateViews";

export default function SettingsScreen() {
  const router = useRouter();
  const { profile, signOut, refreshProfile } = useAuth();
  const [shopName, setShopName] = useState(profile?.shop_name ?? "");
  const [ownerName, setOwnerName] = useState(profile?.owner_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(profile?.preferred_language ?? "en-IN");

  async function handleSaveProfile() {
    setError(null);
    if (!shopName.trim()) {
      setError("Shop name cannot be empty.");
      return;
    }
    setSaving(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        shop_name: shopName.trim(),
        owner_name: ownerName.trim() || null,
        phone: phone.trim() || null,
        preferred_language: selectedLang,
      })
      .eq("id", profile!.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await refreshProfile();
    Alert.alert("Saved", "Your shop profile has been updated.");
  }

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  const langLabel = LANGUAGES.find((l) => l.code === selectedLang)?.label ?? "English";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.sectionLabel}>Shop profile</Text>
        <View style={styles.card}>
          <FormField label="Shop name" value={shopName} onChangeText={setShopName} placeholder="Your shop name" autoCapitalize="words" />
          <FormField label="Owner name (optional)" value={ownerName} onChangeText={setOwnerName} placeholder="Your name" autoCapitalize="words" />
          <FormField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="98XXXXXXXX" keyboardType="phone-pad" />
        </View>

        <Text style={styles.sectionLabel}>Voice language</Text>
        <Pressable style={styles.card} onPress={() => setLangOpen(!langOpen)}>
          <View style={styles.langRow}>
            <Globe color={theme.colors.forest} size={20} />
            <View style={{ flex: 1 }}>
              <Text style={styles.langLabel}>Speak Entry language</Text>
              <Text style={styles.langValue}>{langLabel}</Text>
            </View>
            <ChevronRight color={theme.colors.gray} size={18} style={{ transform: [{ rotate: langOpen ? "90deg" : "0deg" }] }} />
          </View>
          {langOpen ? (
            <View style={styles.langList}>
              {LANGUAGES.map((l) => (
                <Pressable
                  key={l.code}
                  onPress={() => {
                    setSelectedLang(l.code);
                    setLangOpen(false);
                  }}
                  style={({ pressed }) => [styles.langItem, pressed && { opacity: 0.6 }]}
                >
                  <Text style={[styles.langItemText, l.code === selectedLang && styles.langItemActive]}>
                    {l.label}
                  </Text>
                  {l.code === selectedLang ? <View style={styles.checkDot} /> : null}
                </Pressable>
              ))}
            </View>
          ) : null}
        </Pressable>

        {error ? <ErrorBanner message={error} /> : null}

        <Button label="Save profile" onPress={handleSaveProfile} loading={saving} size="lg" style={{ marginTop: 8 }} />

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <View style={styles.aboutRow}>
            <Info color={theme.colors.gray} size={18} />
            <Text style={styles.aboutText}>
              BolKhata is a digital ledger that records transactions you report. It does not initiate payments or connect to UPI.
            </Text>
          </View>
        </View>

        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <LogOut color={theme.colors.error} size={18} />
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.versionText}>BolKhata v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.grayBg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 },
  title: { fontFamily: theme.fonts.display, fontSize: 26, color: theme.colors.nearBlack, marginBottom: 20 },
  sectionLabel: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.gray, marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 18,
    ...theme.shadow.soft,
  },
  langRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  langLabel: { fontFamily: theme.fonts.bodyMed, fontSize: 14, color: theme.colors.nearBlack },
  langValue: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.gray, marginTop: 2 },
  langList: { marginTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.grayLight, paddingTop: 8 },
  langItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  langItemText: { fontFamily: theme.fonts.body, fontSize: 15, color: theme.colors.nearBlack },
  langItemActive: { fontFamily: theme.fonts.bodyBold, color: theme.colors.forest },
  checkDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.forest },
  aboutRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  aboutText: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.gray, flex: 1, lineHeight: 20 },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingVertical: 15,
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: theme.colors.errorSoft,
  },
  signOutText: { fontFamily: theme.fonts.bodyBold, fontSize: 15, color: theme.colors.error },
  versionText: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray, textAlign: "center", marginTop: 16 },
});
