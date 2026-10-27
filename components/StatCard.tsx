import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { theme } from "../lib/theme";

interface Props {
  label: string;
  value: string;
  accent?: string;
  background?: string;
  style?: ViewStyle;
  valueColor?: string;
}

export function StatCard({
  label,
  value,
  accent = theme.colors.nearBlack,
  background = theme.colors.white,
  style,
  valueColor,
}: Props) {
  return (
    <View style={[styles.card, { backgroundColor: background }, style]}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor ?? theme.colors.nearBlack }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    minHeight: 110,
    justifyContent: "center",
    ...theme.shadow.card,
  },
  accentBar: {
    width: 28,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  label: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 12,
    color: theme.colors.gray,
    marginBottom: 4,
  },
  value: {
    fontFamily: theme.fonts.display,
    fontSize: 22,
  },
});
