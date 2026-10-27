import { useState } from "react";
import { StyleSheet, View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Mic } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { Button } from "@/components/Button";
import { FormField } from "@/components/FormField";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
    }
    // On success, onAuthStateChange redirects via the auth layout.
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
        <Text style={styles.tagline}>Your voice-first digital ledger</Text>
      </View>

      <View style={styles.formArea}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to manage your shop's khata.</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

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
          placeholder="Enter password"
          secureTextEntry
        />

        <Button label="Sign in" onPress={handleLogin} loading={loading} size="lg" />

        <Pressable
          onPress={() => router.push("/(auth)/register")}
          style={({ pressed }) => [styles.switchLink, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.switchText}>
            New to BolKhata? <Text style={styles.switchBold}>Create an account</Text>
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
    paddingTop: 64,
    paddingBottom: 36,
    backgroundColor: theme.colors.nearBlack,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
  },
  limeBlob: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.lime,
    opacity: 0.9,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  brandName: {
    fontFamily: theme.fonts.display,
    fontSize: 32,
    color: theme.colors.white,
  },
  tagline: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.gray2,
    marginTop: 4,
  },
  formArea: { paddingHorizontal: 24, paddingTop: 32 },
  title: { fontFamily: theme.fonts.display, fontSize: 26, color: theme.colors.nearBlack },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.gray,
    marginTop: 6,
    marginBottom: 24,
  },
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
