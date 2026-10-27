import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { EntryProvider, useEntryDraft } from "@/lib/entry-context";

function EntryRouteSetter() {
  const params = useLocalSearchParams<{ mode?: string; partyId?: string }>();
  const { resetDraft } = useEntryDraft();

  useEffect(() => {
    resetDraft(params.mode === "voice" ? "voice" : "manual");
  }, [params.mode]);

  return null;
}

export default function EntryLayout() {
  return (
    <EntryProvider>
      <EntryRouteSetter />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="voice" />
        <Stack.Screen name="manual" />
        <Stack.Screen name="verify" />
      </Stack>
    </EntryProvider>
  );
}
