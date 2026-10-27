// Voice recording utility using the Web MediaRecorder API.
// Works on the web platform (the project's default). On native, expo-av would
// be needed, but the web preview uses the browser's built-in recorder.

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

export function isRecordingSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.mediaDevices && !!window.MediaRecorder;
}

export async function startRecording(): Promise<void> {
  if (!isRecordingSupported()) {
    throw new Error("Recording is not supported in this environment.");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioChunks = [];
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) audioChunks.push(event.data);
  };

  mediaRecorder.start();
}

export function stopRecording(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error("No recording in progress."));
      return;
    }

    mediaRecorder.onstop = async () => {
      try {
        const blob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || "audio/webm" });
        const base64 = await blobToBase64(blob);
        // Stop all audio tracks so the mic indicator turns off.
        if (mediaRecorder?.stream) {
          mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        }
        mediaRecorder = null;
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    };

    mediaRecorder.stop();
  });
}

export function cancelRecording(): void {
  if (mediaRecorder) {
    if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
    if (mediaRecorder.stream) {
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    }
    mediaRecorder = null;
  }
  audioChunks = [];
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the data URL prefix: "data:audio/webm;base64,XXXX"
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
