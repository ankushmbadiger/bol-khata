import { StyleSheet, Text, TextInput, View } from "react-native";
import { theme } from "../lib/theme";

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "numeric" | "phone-pad" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words";
  error?: string;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  error,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.gray2}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapstrate(autoCapitalize)}
        style={[styles.input, !!error && styles.inputError]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function autoCapstrate(v: "none" | "sentences" | "words") {
  return v;
}

const styles = StyleSheet.create({
  wrap: { marginBottom: theme.spacing.md },
  label: {
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.gray,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: theme.colors.grayLight,
    borderRadius: theme.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: theme.fonts.body,
    color: theme.colors.nearBlack,
    backgroundColor: theme.colors.white,
  },
  inputError: { borderColor: theme.colors.error },
  error: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 5,
  },
});
