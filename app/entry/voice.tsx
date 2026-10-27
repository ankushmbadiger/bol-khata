import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mic, X, Square, Loader2, AlertCircle } from "lucide-react-native";
import { theme } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { useEntryDraft } from "@/lib/entry-context";
import { transcribeAudio, parseTranscript } from "@/lib/sarvam";
import { startRecording, stopRecording, cancelRecording, isRecordingSupported } from "@/lib/voice";
import { LANGUAGES } from "@/lib/types";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/StateViews";

type State = "idle" | "recording" | "processing" | "error";

export default function VoiceRecordScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { updateDraft } = useEntryDraft();
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const langCode = profile?.preferred_language ?? "en-IN";
  const langLabel = LANGUAGES.find((l) => l.code === langCode)?.label ?? "English";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cancelRecording();
    };
  }, []);

  async function handleStart() {
    setError(null);
    if (!isRecordingSupported()) {
      setError("Microphone recording is not available in this browser. Use manual entry instead.");
      setState("error");
      return;
    }
    try {
      await startRecording();
      setState("recording");
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError("Could not access the microphone. Check permissions and try again.");
      setState("error");
    }
  }

  async function handleStop() {
    if (timerRef.current) clearInterval(timerRef.current);
    setState("processing");
    try {
      const base64 = await stopRecording();
      const result = await transcribeAudio(base64, langCode);

      const parsed = parseTranscript(result.transcript);
      updateDraft({
        party_name: parsed.party_name,
        party_type: parsed.party_type,
        direction: parsed.direction,
        amount: parsed.amount,
        payment_mode: parsed.payment_mode as any,
        note: parsed.note,
        transcript: result.transcript,
        source: "voice",
      });

      // Navigate to verify. If the transcript was mock, the verify screen
      // will show a banner so the user knows it's not real AI output.
      router.replace("/entry/verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Voice processing failed.");
      setState("error");
    }
  }

  function handleCancel() {
    if (timerRef.current) clearInterval(timerRef.current);
    cancelRecording();
    setState("idle");
    setSeconds(0);
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.dismiss()} hitSlop={12}>
          <X color={theme.colors.nearBlack} size={26} />
        </Pressable>
        <Text style={styles.headerTitle}>Speak Entry</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.langPill}>Language: {langLabel}</Text>

        {error ? <ErrorBanner message={error} /> : null}

        {state === "idle" && (
          <View style={styles.centerArea}>
            <Text style={styles.instruction}>Tap the microphone to start recording your entry.</Text>
            <Text style={styles.example}>
              Example: "Ramesh ko 500 rupye udhaar diya cash mein"
            </Text>
            <Pressable onPress={handleStart} style={({ pressed }) => [styles.micBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
              <Mic color={theme.colors.nearBlack} size={48} strokeWidth={2.4} />
            </Pressable>
            <Text style={styles.tapHint}>Tap to record</Text>
          </View>
        )}

        {state === "recording" && (
          <View style={styles.centerArea}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>Recording...</Text>
            <Text style={styles.timer}>{timeStr}</Text>
            <Pressable onPress={handleStop} style={({ pressed }) => [styles.stopBtn, pressed && { transform: [{ scale: 0.95 }] }]}>
              <Square color={theme.colors.white} size={28} fill={theme.colors.white} />
            </Pressable>
            <Text style={styles.tapHint}>Tap to stop</Text>
            <Pressable onPress={handleCancel} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Cancel recording</Text>
            </Pressable>
          </View>
        )}

        {state === "processing" && (
          <View style={styles.centerArea}>
            <Loader2 color={theme.colors.forest} size={40} style={{ marginBottom: 16 }} />
            <Text style={styles.processingText}>Processing your speech...</Text>
            <Text style={styles.processingSub}>Sending to Sarvam AI for transcription</Text>
          </View>
        )}

        {state === "error" && (
          <View style={styles.centerArea}>
            <View style={styles.errorIconWrap}>
              <AlertCircle color={theme.colors.error} size={36} />
            </View>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <View style={styles.errorBtns}>
              <Button label="Try again" onPress={handleStart} style={{ flex: 1, marginRight: 8 }} />
              <Button
                label="Enter manually"
                onPress={() => router.replace("/entry/manual")}
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontFamily: theme.fonts.display, fontSize: 20, color: theme.colors.nearBlack },
  body: { flex: 1, paddingHorizontal: 24, paddingBottom: 40 },
  langPill: {
    alignSelf: "center",
    fontFamily: theme.fonts.bodyMed,
    fontSize: 13,
    color: theme.colors.forest,
    backgroundColor: theme.colors.mint,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    marginBottom: 24,
  },
  centerArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  instruction: { fontFamily: theme.fonts.body, fontSize: 16, color: theme.colors.gray, textAlign: "center", marginBottom: 8 },
  example: { fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.gray2, textAlign: "center", fontStyle: "italic", marginBottom: 36 },
  micBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.lime,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadow.card,
  },
  tapHint: { fontFamily: theme.fonts.bodyMed, fontSize: 14, color: theme.colors.gray, marginTop: 16 },
  recordingDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.error, marginBottom: 12 },
  recordingText: { fontFamily: theme.fonts.display, fontSize: 22, color: theme.colors.nearBlack },
  timer: { fontFamily: theme.fonts.display, fontSize: 40, color: theme.colors.forest, marginTop: 8, marginBottom: 36 },
  stopBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.nearBlack,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelLink: { marginTop: 20 },
  cancelText: { fontFamily: theme.fonts.bodyMed, fontSize: 14, color: theme.colors.gray },
  processingText: { fontFamily: theme.fonts.display, fontSize: 20, color: theme.colors.nearBlack },
  processingSub: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.gray, marginTop: 6 },
  errorIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.errorSoft, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  errorTitle: { fontFamily: theme.fonts.display, fontSize: 20, color: theme.colors.nearBlack },
  errorSub: { fontFamily: theme.fonts.body, fontSize: 14, color: theme.colors.gray, textAlign: "center", marginTop: 8, marginBottom: 24, paddingHorizontal: 20 },
  errorBtns: { flexDirection: "row", paddingHorizontal: 16 },
});
