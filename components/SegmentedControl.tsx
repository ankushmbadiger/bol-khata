import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T | null;
  onSelect: (v: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onSelect }: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[styles.segment, selected && styles.segmentActive]}
          >
            <Text
              style={[
                styles.label,
                selected && styles.labelActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.colors.grayBg,
    borderRadius: theme.radius.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: theme.colors.nearBlack,
  },
  label: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 14,
    color: theme.colors.gray,
  },
  labelActive: {
    color: theme.colors.white,
    fontFamily: theme.fonts.bodyBold,
  },
});
