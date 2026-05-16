let sharedAudioContext: AudioContext | null = null;

export function playTone(kind: "correct" | "complete" | "combo" | "energy" | "mistake", combo = 1) {
  const AudioContextClass =
    window.AudioContext ||
    (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = (sharedAudioContext ??= new AudioContextClass());
  const now = context.currentTime;
  const gain = context.createGain();
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, now);

  if (context.state === "suspended") {
    context.resume().catch(() => undefined);
  }

  const tone = (frequency: number, start: number, duration: number, volume = 0.08) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + start);
    oscillator.connect(gain);
    gain.gain.exponentialRampToValueAtTime(volume, now + start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
    oscillator.start(now + start);
    oscillator.stop(now + start + duration + 0.02);
  };

  if (kind === "mistake") {
    tone(150, 0, 0.14, 0.06);
    return;
  }

  const comboLift = Math.min(combo, 6) * 42;
  const base = kind === "energy" ? 760 : kind === "complete" ? 620 + comboLift : 440 + comboLift;
  tone(base, 0, 0.11);
  tone(base * 1.25, 0.08, 0.12, kind === "complete" ? 0.1 : 0.07);
  if (kind === "energy") tone(base * 1.62, 0.17, 0.16, 0.1);
  if (kind === "complete" || combo > 2) tone(base * 1.5, 0.18, 0.14, 0.08);
}

export function triggerMistakeFeedback() {
  const vibrate = (navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }).vibrate;
  vibrate?.call(navigator, 35);
}
