import { StyleSheet, View, Text } from "react-native";
import { theme } from "../lib/theme";

export function EmptyState({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function ScreenLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <View style={styles.loadingWrap}>
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", paddingVertical: 48, paddingHorizontal: 24 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.mint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { fontFamily: theme.fonts.display, fontSize: 18, color: theme.colors.nearBlack, textAlign: "center" },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.gray,
    textAlign: "center",
    marginTop: 6,
  },
  error: {
    backgroundColor: theme.colors.errorSoft,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  errorText: { fontFamily: theme.fonts.bodyMed, fontSize: 13, color: theme.colors.error },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.gray },
});
