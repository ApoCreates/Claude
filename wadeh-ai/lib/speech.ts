// Read-aloud via the browser's built-in speech engine — free, offline-capable,
// and bilingual. Serves blind learners, early readers, and auditory learners.

import type { Lang } from "./curriculum";

export function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, lang: Lang, rate = 0.95) {
  if (!canSpeak() || !text.trim()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "ar" ? "ar-SA" : "en-US";
  u.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const match = voices.find((v) => v.lang.toLowerCase().startsWith(lang === "ar" ? "ar" : "en"));
  if (match) u.voice = match;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel();
}
