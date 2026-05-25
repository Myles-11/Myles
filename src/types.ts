export type TaskRole = "focus" | "break" | "maintenance";

export interface Task {
  id: string;
  title: string;
  type: TaskRole;
  durationMin: number;
  timeSlot: string;
  description: string;
  stressImpact: "low" | "medium" | "high";
  mindfulnessTip: string;
  completed: boolean;
}

export interface MoodLog {
  id: string;
  timestamp: string; // ISO String
  mood: "very_anxious" | "anxious" | "neutral" | "peaceful" | "joyful";
  value: number; // 1 to 5 scale
  energy: number; // 1 to 5 scale
  stress: number; // 1 to 5 scale
  note: string;
  audioUrl?: string; // base64 data url
  audioDuration?: number; // duration in seconds
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  audioUrl?: string; // base64 representation of user speak entries
  audioDuration?: number; // length of message in seconds
}

export type BreathingPatternName = "calming" | "box" | "energizing";

export interface BreathingPattern {
  name: BreathingPatternName;
  label: string;
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  restSec: number;
  description: string;
}

export const BREATHING_PATTERNS: BreathingPattern[] = [
  {
    name: "calming",
    label: "Calming Breath (4-7-8)",
    inhaleSec: 4,
    holdSec: 7,
    exhaleSec: 8,
    restSec: 0,
    description: "Deeply lowers cortisol, relaxes the parasympathetic nervous system, and combats acute anxiety.",
  },
  {
    name: "box",
    label: "Box Breathing (4-4-4-4)",
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 4,
    restSec: 4,
    description: "Used by elite performers and first responders to lock in calm concentration and cognitive control.",
  },
  {
    name: "energizing",
    label: "Grounding Focus (4-2-4)",
    inhaleSec: 4,
    holdSec: 2,
    exhaleSec: 4,
    restSec: 0,
    description: "Balanced, natural cadence to restore concentration, align spinal posture, and clear fatigue.",
  },
];
