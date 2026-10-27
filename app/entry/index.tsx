import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams, Redirect } from "expo-router";
import { theme } from "@/lib/theme";

export default function EntryIndex() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; partyId?: string }>();

  useEffect(() => {
    if (params.mode === "voice") {
      router.replace("/entry/voice");
    } else {
      router.replace("/entry/manual");
    }
  }, [params.mode]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.white }}>
      <ActivityIndicator color={theme.colors.forest} size="large" />
    </View>
  );
}
