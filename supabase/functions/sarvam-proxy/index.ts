// Sarvam AI proxy edge function.
// Keeps the SARVAM_API_KEY server-side. The mobile app never sees the key.
// Expects: POST { audio: base64, language: string, mime?: string }
// Returns: { transcript, source: 'sarvam' | 'mock' } on success.
// When SARVAM_API_KEY is not configured, returns a clearly-labeled mock so the
// UI flow stays testable. The app must surface `source === 'mock'` to the user.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const audio: string | undefined = body?.audio;
    const language: string | undefined = body?.language;
    const mime: string = body?.mime || "audio/wav";

    if (!audio || typeof audio !== "string") {
      return new Response(JSON.stringify({ error: "Missing base64 audio payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("SARVAM_API_KEY");

    if (!apiKey) {
      // No key configured. Return a clearly-labeled mock transcript so the UI
      // flow can be exercised. The app MUST show that this is mock output.
      return new Response(
        JSON.stringify({
          transcript: "Ramesh ko bees rupye udhaar diya",
          source: "mock",
          mock: true,
          message: "SARVAM_API_KEY not configured on the server. Returning mock transcript for testing.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Call Sarvam AI speech-to-text with the server-side key.
    const sarvamRes = await fetch(SARVAM_STT_URL, {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio,
        mime,
        language: language || "en-IN",
        model: "saarika:v2.5",
      }),
    });

    if (!sarvamRes.ok) {
      const errText = await sarvamRes.text();
      return new Response(
        JSON.stringify({
          error: "Sarvam AI request failed",
          status: sarvamRes.status,
          detail: errText,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await sarvamRes.json();
    const transcript = data?.transcript || data?.text || "";

    return new Response(
      JSON.stringify({ transcript, source: "sarvam" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
