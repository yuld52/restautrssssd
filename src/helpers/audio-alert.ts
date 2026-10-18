/**
 * Utilitário de som usando Web Audio API nativo.
 * Garante reprodução de som cristalina, offline, sem arquivos externos e sem latência.
 */

class SoundAlertManager {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Toca um sino realista de recepção/restaurante (🛎️ Ding-Dong!)
   * Frequências harmônicas que simulam o sino de metal de atendimento.
   */
  public playWaiterBell(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Primeiro toque (Ding agudo)
    this.playTone(ctx, 1175, now, 0.9, 0.4); // D6
    this.playTone(ctx, 1760, now, 0.7, 0.25); // Harmônico
    this.playTone(ctx, 2349, now, 0.4, 0.15); // Brilho metálico

    // Segundo toque (Dong ressonante após 180ms)
    const secondTone = now + 0.18;
    this.playTone(ctx, 880, secondTone, 1.2, 0.5); // A5
    this.playTone(ctx, 1318, secondTone, 0.9, 0.3); // Harmônico
    this.playTone(ctx, 2093, secondTone, 0.5, 0.2); // Brilho
  }

  /**
   * Toca um bipe suave de confirmação para o cliente (Ding!)
   */
  public playCustomerConfirmation(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.playTone(ctx, 1046, now, 0.6, 0.35); // C6
    this.playTone(ctx, 1568, now + 0.08, 0.8, 0.4); // G6
  }

  /**
   * Sintetiza uma frequência senoidal com decaimento exponencial natural
   */
  private playTone(
    ctx: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    volume: number
  ): void {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, startTime);

      // Curva de volume: ataque rápido e decaimento suave
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Ignora erro caso navegador bloqueie antes do gesto
    }
  }
}

export const soundAlert = new SoundAlertManager();
