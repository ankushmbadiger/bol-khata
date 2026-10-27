import { useState } from "react";
import { StyleSheet, View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Mic } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export default function RegisterScreen() {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError(null);
    if (!shopName.trim() || !email.trim() || !password) {
      setError("Fill in your shop name, email, and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { shop_name: shopName.trim() } },
    });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }
    // Update the auto-created profile with the shop name.
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ shop_name: shopName.trim() })
        .eq("id", data.user.id);
    }
    setLoading(false);
    // onAuthStateChange will redirect to tabs.
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brandArea}>
        <View style={styles.limeBlob} />
        <View style={styles.logoCircle}>
          <Mic color={theme.colors.nearBlack} size={30} strokeWidth={2.2} />
        </View>
        <Text style={styles.brandName}>BolKhata</Text>
        <Text style={styles.tagline}>Create your shop account</Text>
      </View>

      <View style={styles.formArea}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FormField
          label="Shop name"
          value={shopName}
          onChangeText={setShopName}
          placeholder="e.g. Sharma Kirana Store"
          autoCapitalize="words"
        />
        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="shop@example.com"
          keyboardType="email-address"
        />
        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
        />

        <Button label="Create account" onPress={handleRegister} loading={loading} variant="lime" size="lg" />

        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={({ pressed }) => [styles.switchLink, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchBold}>Sign in</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.white },
  container: { flexGrow: 1 },
  brandArea: {
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 32,
    backgroundColor: theme.colors.forest,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
  },
  limeBlob: {
    position: "absolute",
    bottom: -40,
    left: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: theme.colors.lime,
    opacity: 0.85,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandName: { fontFamily: theme.fonts.display, fontSize: 28, color: theme.colors.white },
  tagline: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.mint, marginTop: 4 },
  formArea: { paddingHorizontal: 24, paddingTop: 28 },
  errorBox: {
    backgroundColor: theme.colors.errorSoft,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  errorText: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.error },
  switchLink: { alignItems: "center", marginTop: 22 },
  switchText: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.gray },
  switchBold: { fontFamily: theme.fonts.bodyBold, color: theme.colors.forest },
});
