import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Compass, Wind, Award, Clock } from "lucide-react";
import { BREATHING_PATTERNS, BreathingPattern, BreathingPatternName } from "../types";

interface BreathingGuideProps {
  onSessionComplete: (durationSec: number) => void;
  suggestedDuration?: number; // suggested duration from CBT reframe
}

type BreathPhase = "Inhale" | "Hold" | "Exhale" | "Rest";

export default function BreathingGuide({ onSessionComplete, suggestedDuration }: BreathingGuideProps) {
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(BREATHING_PATTERNS[0]);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<BreathPhase>("Inhale");
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(selectedPattern.inhaleSec);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0);
  const [sessionCompletedCount, setSessionCompletedCount] = useState<number>(() => {
    return Number(localStorage.getItem("breathing_sessions_count") || "0");
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Suggested duration indicator
  const durationTarget = suggestedDuration || 120; // Default 2 minutes

  // Auto-switch to matching suggested duration if provided
  useEffect(() => {
    resetSession();
  }, [selectedPattern]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTotalSecondsElapsed((prev) => prev + 1);
        setPhaseSecondsLeft((prev) => {
          if (prev <= 1) {
            // Transition to next phase
            const nextPhaseMap: Record<BreathPhase, BreathPhase> = {
              Inhale: selectedPattern.holdSec > 0 ? "Hold" : "Exhale",
              Hold: "Exhale",
              Exhale: selectedPattern.restSec > 0 ? "Rest" : "Inhale",
              Rest: "Inhale",
            };

            const next = nextPhaseMap[phase];
            setPhase(next);

            // Set seconds for next phase
            if (next === "Inhale") return selectedPattern.inhaleSec;
            if (next === "Hold") return selectedPattern.holdSec;
            if (next === "Exhale") return selectedPattern.exhaleSec;
            if (next === "Rest") return selectedPattern.restSec;
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase, selectedPattern]);

  // Track session milestones
  useEffect(() => {
    if (totalSecondsElapsed > 0 && totalSecondsElapsed % durationTarget === 0) {
      const newsessions = sessionCompletedCount + 1;
      setSessionCompletedCount(newsessions);
      localStorage.setItem("breathing_sessions_count", String(newsessions));
      onSessionComplete(durationTarget);
    }
  }, [totalSecondsElapsed, durationTarget]);

  const toggleSession = () => {
    setIsActive(!isActive);
  };

  const resetSession = () => {
    setIsActive(false);
    setPhase("Inhale");
    setPhaseSecondsLeft(selectedPattern.inhaleSec);
    setTotalSecondsElapsed(0);
  };

  const selectPatternByName = (name: BreathingPatternName) => {
    const pattern = BREATHING_PATTERNS.find((p) => p.name === name) || BREATHING_PATTERNS[0];
    setSelectedPattern(pattern);
  };

  // Compute dynamic circle styling for breathing stages
  const getCircleScale = () => {
    if (!isActive) return "scale-100 bg-white/5 border border-white/10 text-white";
    if (phase === "Inhale") {
      // Scale up as inhale finishes
      const elapsed = selectedPattern.inhaleSec - phaseSecondsLeft;
      const ratio = 1 + (elapsed / selectedPattern.inhaleSec) * 0.4; // 1.0 to 1.4
      return "bg-blue-500/15 border-[5px] border-blue-400 text-white shadow-[0_0_20px_rgba(96,165,250,0.4)]";
    }
    if (phase === "Hold") {
      return "scale-120 bg-purple-500/20 border-[5px] border-purple-400 text-white shadow-[0_0_30px_rgba(167,139,250,0.6)]";
    }
    if (phase === "Exhale") {
      // Scale down as exhale finishes
      const elapsed = selectedPattern.exhaleSec - phaseSecondsLeft;
      const ratio = 1.4 - (elapsed / selectedPattern.exhaleSec) * 0.4; // 1.4 to 1.0
      return "bg-emerald-500/15 border-[5px] border-emerald-400 text-white shadow-[0_0_20px_rgba(52,211,153,0.4)]";
    }
    // Rest stage
    return "scale-100 bg-white/10 border-[5px] border-white/20 text-white/90";
  };

  const getPhaseColorClass = () => {
    switch (phase) {
      case "Inhale": return "text-blue-400";
      case "Hold": return "text-purple-400";
      case "Exhale": return "text-emerald-400";
      case "Rest": return "text-white/60";
    }
  };

  const getPhaseMessage = () => {
    switch (phase) {
      case "Inhale": return "Slowly draw air into your lungs...";
      case "Hold": return "Suspend the breath, finding pure stillness...";
      case "Exhale": return "Let go completely, releasing cognitive fatigue...";
      case "Rest": return "Acknowledge the quiet space inside...";
    }
  };

  return (
    <div id="breathing-guide" className="glass-panel p-6 md:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/15 rounded-xl text-blue-400 border border-blue-500/20">
            <Wind className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Breathing & Stillness Sanctuary</h2>
            <p className="text-xs text-white/60">Practice nervous system regulation with structured rhythms</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono bg-white/10 px-3 py-1.5 rounded-full text-blue-300 font-medium self-start sm:self-auto border border-white/5">
          <Award className="w-4 h-4 text-amber-400" />
          <span>{sessionCompletedCount} daily completions</span>
        </div>
      </div>

      {suggestedDuration && (
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center gap-3 animate-fade-in text-purple-200">
          <Clock className="w-4 h-4 text-purple-400 shrink-0" />
          <p className="text-xs">
            <strong>Recommended practice target:</strong> Rest your focus of focus blocks for <strong>{(suggestedDuration / 60).toFixed(0)} minutes</strong> to safely center your nervous system.
          </p>
        </div>
      )}

      {/* RHYTHM SELECTORS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {BREATHING_PATTERNS.map((p) => (
          <button
            key={p.name}
            onClick={() => selectPatternByName(p.name)}
            className={`text-left p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
              selectedPattern.name === p.name
                ? "border-blue-400/50 bg-white/10 shadow-lg text-white"
                : "border-white/5 hover:border-white/15 bg-white/5 text-white/70"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-sm font-semibold ${selectedPattern.name === p.name ? "text-blue-400" : "text-white/90"}`}>
                {p.label.split(" (")[0]}
              </span>
              <span className="text-[10px] font-mono bg-white/10 text-white/60 px-2 py-0.5 rounded">
                {p.inhaleSec}-{p.holdSec}-{p.exhaleSec}{p.restSec > 0 ? `-${p.restSec}` : ""}
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-normal line-clamp-2">{p.description}</p>
          </button>
        ))}
      </div>

      {/* DYNAMIC BREATHING CIRCLE WINDOW */}
      <div className="flex flex-col items-center justify-center py-10 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden mb-8">
        <div className="absolute inset-0 z-0 bg-radial from-blue-500/5 to-transparent pointer-events-none"></div>
        
        {/* Breathing Ring */}
        <div className="relative z-10 w-64 h-64 flex items-center justify-center">
          {/* Animated pulsing glow */}
          <div
            className={`absolute rounded-full transition-all duration-1000 ease-in-out ${getCircleScale()} w-48 h-48 flex flex-col items-center justify-center`}
          >
            <span className="text-[10px] font-mono uppercase tracking-widest text-white/60 mb-1">
              {isActive ? "ACTIVE CYCLE" : "PEACEFUL REST"}
            </span>
            <span className={`text-3xl font-extrabold font-heading tracking-tight drop-shadow-sm ${getPhaseColorClass()}`}>
              {phaseSecondsLeft}
            </span>
            <span className="text-xs text-white/70 font-medium font-mono lowercase mt-1">seconds left</span>
          </div>

          {/* Core Phase Label */}
          <div className="absolute -bottom-6 flex flex-col items-center">
            <span className={`text-xl font-bold font-heading uppercase tracking-widest ${getPhaseColorClass()} transition-colors duration-500`}>
              {phase}
            </span>
          </div>
        </div>

        {/* Phase Action Cue Message */}
        <p className="mt-12 text-sm text-white/80 text-center px-6 max-w-sm h-10 font-medium transition-all duration-500">
          {getPhaseMessage()}
        </p>

        {/* Session Progression Timer */}
        <div className="mt-4 text-xs font-mono text-white/60 bg-white/10 px-3 py-1.5 rounded-full border border-white/5">
          Session timer: <strong className="text-white">{Math.floor(totalSecondsElapsed / 60)}m {totalSecondsElapsed % 60}s</strong>
          {totalSecondsElapsed > 0 && ` / ${(durationTarget / 60).toFixed(1)}m target`}
        </div>
      </div>

      {/* INTERACTIVE CONTROLS */}
      <div className="flex justify-center items-center gap-4">
        <button
          onClick={resetSession}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/5"
          title="Reset sequence"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={toggleSession}
          className={`flex items-center gap-2.5 px-8 py-4 rounded-full font-medium transition-all shadow-lg ${
            isActive
              ? "bg-[#334155] border border-white/10 hover:bg-[#1e293b] text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Focus</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>Begin Breathing</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
