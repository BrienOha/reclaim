import { create } from 'zustand';

export type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

interface TimerState {
  // Urge 10-minute countdown
  isUrgeActive: boolean;
  urgeSecondsRemaining: number;
  breathingPhase: BreathingPhase;
  breathingSeconds: number; // 4-7-8 seconds tracker

  // Hobby Live Session Timer
  isHobbyTimerActive: boolean;
  activeHobbyId: string | null;
  activeHobbyTitle: string | null;
  hobbyElapsedSeconds: number;

  startUrgeCountdown: () => void;
  tickUrgeCountdown: () => void;
  stopUrgeCountdown: () => void;

  startHobbyTimer: (hobbyId: string, hobbyTitle: string) => void;
  tickHobbyTimer: () => void;
  stopHobbyTimer: () => number; // returns elapsed minutes
}

export const useTimerStore = create<TimerState>((set, get) => ({
  isUrgeActive: false,
  urgeSecondsRemaining: 600, // 10 minutes (600s)
  breathingPhase: 'inhale',
  breathingSeconds: 4,

  isHobbyTimerActive: false,
  activeHobbyId: null,
  activeHobbyTitle: null,
  hobbyElapsedSeconds: 0,

  startUrgeCountdown: () => {
    set({
      isUrgeActive: true,
      urgeSecondsRemaining: 600,
      breathingPhase: 'inhale',
      breathingSeconds: 4,
    });
  },

  tickUrgeCountdown: () => {
    const { urgeSecondsRemaining, breathingPhase, breathingSeconds } = get();
    if (urgeSecondsRemaining <= 0) {
      set({ isUrgeActive: false });
      return;
    }

    // 4-4-4-4 Box Breathing cycle
    let nextPhase = breathingPhase;
    let nextBreathingSec = breathingSeconds - 1;

    if (nextBreathingSec <= 0) {
      switch (breathingPhase) {
        case 'inhale':
          nextPhase = 'hold';
          nextBreathingSec = 4;
          break;
        case 'hold':
          nextPhase = 'exhale';
          nextBreathingSec = 4;
          break;
        case 'exhale':
          nextPhase = 'rest';
          nextBreathingSec = 4;
          break;
        case 'rest':
          nextPhase = 'inhale';
          nextBreathingSec = 4;
          break;
      }
    }

    set({
      urgeSecondsRemaining: urgeSecondsRemaining - 1,
      breathingPhase: nextPhase,
      breathingSeconds: nextBreathingSec,
    });
  },

  stopUrgeCountdown: () => {
    set({ isUrgeActive: false, urgeSecondsRemaining: 600 });
  },

  startHobbyTimer: (hobbyId: string, hobbyTitle: string) => {
    set({
      isHobbyTimerActive: true,
      activeHobbyId: hobbyId,
      activeHobbyTitle: hobbyTitle,
      hobbyElapsedSeconds: 0,
    });
  },

  tickHobbyTimer: () => {
    set({ hobbyElapsedSeconds: get().hobbyElapsedSeconds + 1 });
  },

  stopHobbyTimer: () => {
    const minutes = Math.max(1, Math.round(get().hobbyElapsedSeconds / 60));
    set({
      isHobbyTimerActive: false,
      activeHobbyId: null,
      activeHobbyTitle: null,
      hobbyElapsedSeconds: 0,
    });
    return minutes;
  },
}));
