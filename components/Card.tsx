import { StyleSheet, View, type ViewStyle } from "react-native";
import { theme } from "../lib/theme";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  dark?: boolean;
  radius?: number;
}

export function Card({ children, style, padded = true, dark = false, radius = theme.radius.lg }: Props) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: dark ? theme.colors.nearBlack : theme.colors.white,
          borderRadius: radius,
        },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  padded: { padding: theme.spacing.lg },
});
