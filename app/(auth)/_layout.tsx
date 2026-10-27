import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import { ActivityIndicator, View } from "react-native";
import { theme } from "@/lib/theme";

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.white }}>
        <ActivityIndicator color={theme.colors.forest} size="large" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
