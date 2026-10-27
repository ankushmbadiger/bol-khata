import { StyleSheet, Text, type TextProps } from "react-native";
import { theme } from "../lib/theme";

type Props = TextProps & {
  variant?: "display" | "h1" | "h2" | "h3" | "body" | "label" | "caption";
  color?: string;
  bold?: boolean;
};

export function AppText({ variant = "body", color, bold, style, ...rest }: Props) {
  const font = pickFont(variant, bold);
  const size = pickSize(variant);
  return (
    <Text
      style={[{ fontFamily: font, fontSize: size, color: color ?? theme.colors.nearBlack }, style]}
      {...rest}
    />
  );
}

function pickFont(variant: Props["variant"], bold?: boolean): string {
  if (bold) return theme.fonts.bodyBold;
  switch (variant) {
    case "display":
    case "h1":
    case "h2":
      return theme.fonts.display;
    case "h3":
      return theme.fonts.displayReg;
    case "label":
      return theme.fonts.bodyMed;
    case "caption":
      return theme.fonts.body;
    default:
      return theme.fonts.body;
  }
}

function pickSize(variant: Props["variant"]): number {
  switch (variant) {
    case "display":
      return 40;
    case "h1":
      return 28;
    case "h2":
      return 22;
    case "h3":
      return 18;
    case "label":
      return 14;
    case "caption":
      return 12;
    default:
      return 15;
  }
}

export const textStyles = StyleSheet.create({
  display: { fontFamily: theme.fonts.display, fontSize: 40, color: theme.colors.nearBlack },
  h1: { fontFamily: theme.fonts.display, fontSize: 28, color: theme.colors.nearBlack },
  h2: { fontFamily: theme.fonts.display, fontSize: 22, color: theme.colors.nearBlack },
  h3: { fontFamily: theme.fonts.displayReg, fontSize: 18, color: theme.colors.nearBlack },
  body: { fontFamily: theme.fonts.body, fontSize: 15, color: theme.colors.nearBlack },
  label: { fontFamily: theme.fonts.bodyMed, fontSize: 14, color: theme.colors.nearBlack },
  caption: { fontFamily: theme.fonts.body, fontSize: 12, color: theme.colors.gray },
});
