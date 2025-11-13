"use client";

import { useEffect, useRef } from "react";
import type { MatchStatus } from "@/types";

interface AudioManagerProps {
  enabled?: boolean;
  status: MatchStatus;
  timeRemaining?: number;
  onBan?: boolean;
  onPick?: boolean;
  onRoll?: boolean;
}

// Web Audio API sound generation for simple effects
class SoundGenerator {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext ||
        (window as never)["webkitAudioContext"])();
    }
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    volume: number = 0.3
  ) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playPhaseChange() {
    // Rising chord for phase change
    this.playTone(440, 0.15, "sine", 0.2);
    setTimeout(() => this.playTone(554, 0.15, "sine", 0.2), 100);
    setTimeout(() => this.playTone(659, 0.3, "sine", 0.25), 200);
  }

  playBan() {
    // Deep, ominous sound for ban
    this.playTone(110, 0.3, "square", 0.15);
    setTimeout(() => this.playTone(90, 0.2, "square", 0.1), 150);
  }

  playPick() {
    // Bright, positive sound for pick
    this.playTone(523, 0.1, "sine", 0.2);
    setTimeout(() => this.playTone(659, 0.1, "sine", 0.2), 80);
    setTimeout(() => this.playTone(784, 0.2, "sine", 0.25), 160);
  }

  playRoll() {
    // Quick ascending tones for roll
    const frequencies = [262, 330, 392, 494, 523];
    frequencies.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.1, "triangle", 0.15), i * 50);
    });
  }

  playTimerWarning() {
    // Short beep for timer warning
    this.playTone(880, 0.1, "square", 0.15);
  }

  playCountdown() {
    // Urgent beep for final countdown
    this.playTone(1047, 0.15, "square", 0.2);
  }
}

export function AudioManager({
  enabled = true,
  status,
  timeRemaining,
  onBan,
  onPick,
  onRoll,
}: AudioManagerProps) {
  const soundGen = useRef<SoundGenerator | null>(null);
  const previousStatus = useRef<MatchStatus>(status);
  const previousTimeRemaining = useRef<number | undefined>(timeRemaining);
  const hasPlayedWarning = useRef(false);

  // Initialize sound generator
  useEffect(() => {
    if (enabled && typeof window !== "undefined") {
      soundGen.current = new SoundGenerator();
    }
  }, [enabled]);

  // Play phase change sound
  useEffect(() => {
    if (!enabled || !soundGen.current) return;

    if (previousStatus.current !== status && previousStatus.current !== status) {
      soundGen.current.playPhaseChange();
    }
    previousStatus.current = status;
  }, [status, enabled]);

  // Play ban sound
  useEffect(() => {
    if (!enabled || !soundGen.current || !onBan) return;
    soundGen.current.playBan();
  }, [onBan, enabled]);

  // Play pick sound
  useEffect(() => {
    if (!enabled || !soundGen.current || !onPick) return;
    soundGen.current.playPick();
  }, [onPick, enabled]);

  // Play roll sound
  useEffect(() => {
    if (!enabled || !soundGen.current || !onRoll) return;
    soundGen.current.playRoll();
  }, [onRoll, enabled]);

  // Play timer warning sounds
  useEffect(() => {
    if (!enabled || !soundGen.current || timeRemaining === undefined) return;

    // Play warning at 10 seconds
    if (timeRemaining === 10 && !hasPlayedWarning.current) {
      soundGen.current.playTimerWarning();
      hasPlayedWarning.current = true;
    }

    // Play countdown beeps for last 3 seconds
    if (timeRemaining <= 3 && timeRemaining > 0) {
      if (previousTimeRemaining.current !== timeRemaining) {
        soundGen.current.playCountdown();
      }
    }

    // Reset warning flag when timer resets
    if (
      previousTimeRemaining.current !== undefined &&
      timeRemaining > previousTimeRemaining.current + 5
    ) {
      hasPlayedWarning.current = false;
    }

    previousTimeRemaining.current = timeRemaining;
  }, [timeRemaining, enabled]);

  // This component doesn't render anything
  return null;
}
