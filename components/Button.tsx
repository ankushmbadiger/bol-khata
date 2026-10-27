import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { theme } from "../lib/theme";

type Variant = "primary" | "lime" | "secondary" | "outline" | "danger" | "ghost";
type Size = "md" | "lg";

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  icon,
  style,
}: Props) {
  const isDark = variant === "primary" || variant === "danger";
  const bg = pickBg(variant);
  const fg = pickFg(variant);
  const border = variant === "outline" ? theme.colors.nearBlack : "transparent";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border, opacity: pressed ? 0.88 : 1 },
        size === "lg" && styles.lg,
        disabled && !loading && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text
            style={[
              styles.label,
              { color: fg, fontFamily: theme.fonts.bodyBold },
              isDark && { fontFamily: theme.fonts.bodyBold },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function pickBg(v: Variant): string {
  switch (v) {
    case "primary":
      return theme.colors.nearBlack;
    case "lime":
      return theme.colors.lime;
    case "secondary":
      return theme.colors.forest;
    case "outline":
      return "transparent";
    case "danger":
      return theme.colors.error;
    case "ghost":
      return "transparent";
  }
}

function pickFg(v: Variant): string {
  switch (v) {
    case "lime":
      return theme.colors.nearBlack;
    case "outline":
    case "ghost":
      return theme.colors.nearBlack;
    default:
      return theme.colors.white;
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    minHeight: 50,
  },
  lg: {
    paddingVertical: 18,
    paddingHorizontal: 28,
    minHeight: 58,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 15, letterSpacing: 0.1 },
});
