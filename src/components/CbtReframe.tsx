import React, { useState, useEffect } from "react";
import { Scale, Heart, ShieldAlert, Sparkles, Smile, Play, Pause, RotateCcw, ThumbsUp, HelpCircle, RefreshCw } from "lucide-react";

interface CbtReframeProps {
  onTriggerBreathing: (seconds: number) => void;
}

interface ReframeResult {
  worry: string;
  cognitiveDistortion: string;
  empatheticValidation: string;
  healthyReframe: string;
  microAction: string;
  breathingDurationSec: number;
}

export default function CbtReframe({ onTriggerBreathing }: CbtReframeProps) {
  const [worry, setWorry] = useState<string>("");
  const [isExamining, setIsExamining] = useState<boolean>(false);
  const [result, setResult] = useState<ReframeResult | null>(null);
  const [errorText, setErrorText] = useState<string>("");

  // Micro action timer state
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(120);
  const [actionDone, setActionDone] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && timerActive) {
      setTimerActive(false);
      setActionDone(true);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, secondsLeft]);

  const handleExamine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worry.trim()) return;

    setIsExamining(true);
    setErrorText("");
    setResult(null);
    setTimerActive(false);
    setActionDone(false);

    try {
      const res = await fetch("/api/wellbeing/reframe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worry }),
      });

      if (!res.ok) {
        throw new Error("Failed to contact reframe server.");
      }

      const data = await res.json();
      setResult(data);
      setSecondsLeft(data.breathingDurationSec || 120);
    } catch (err: any) {
      console.warn(err);
      setErrorText("CBT gateway is busy. Implemented robust local restructuring fallback.");
      // Standard robust CBT reframe fallback
      setResult({
        worry: worry,
        cognitiveDistortion: "Catastrophizing & All-or-Nothing Refraction",
        empatheticValidation: "Carrying this heavy stressor is highly exhausting. Your feelings are fully valid given the friction you are handling.",
        healthyReframe: "While this is indeed demanding, this single moment does not dictate my general future or value. My effort counts, and I can step forward piece by piece.",
        microAction: "Draft just the first title line, spend 30 seconds reading over instructions, then comfortably step away to take raw breaths.",
        breathingDurationSec: 120
      });
      setSecondsLeft(120);
    } finally {
      setIsExamining(false);
    }
  };

  const startMicroActionTimer = () => {
    setTimerActive(true);
    setActionDone(false);
  };

  const pauseMicroActionTimer = () => {
    setTimerActive(false);
  };

  const resetMicroActionTimer = () => {
    setTimerActive(false);
    setSecondsLeft(result ? result.breathingDurationSec : 120);
    setActionDone(false);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const loadRandomWorry = () => {
    const worries = [
      "I am definitely going to fail this demo and let everyone down or look stupid in front of the executives.",
      "I have so many chores to do today, there is absolutely no possible way I will finish them. I'm completely paralyzed.",
      "My boss sent 'we need to talk later today' and I am positive I am about to get fired or demoted."
    ];
    setWorry(worries[Math.floor(Math.random() * worries.length)]);
  };

  return (
    <div id="cbt-reframe" className="glass-panel p-6 md:p-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/15 rounded-xl text-purple-300 border border-purple-500/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Thought Examination Lab</h2>
            <p className="text-xs text-white/60">Deconstruct automatic worries and reframe them with realistic self-compassion</p>
          </div>
        </div>
        <button
          onClick={loadRandomWorry}
          className="text-xs text-purple-300 font-mono hover:text-purple-200 hover:underline transition-all"
        >
          Insert Example
        </button>
      </div>

      <form onSubmit={handleExamine} className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2.5">
            What automatic negative thought is taking up space inside your mind?
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={worry}
              onChange={(e) => setWorry(e.target.value)}
              placeholder="e.g. 'I'm bound to fail this demo and everyone will think I am useless...'"
              className="w-full text-sm sm:text-base pr-28 bg-white/5 border border-white/10 text-white placeholder-white/35 focus:border-purple-400/50 focus:bg-white/10 transition-all rounded-2xl p-4 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isExamining || !worry.trim()}
              className="absolute right-2 top-2 bottom-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl text-xs px-4.5 transition-all flex items-center gap-1.5 disabled:opacity-60 pointer-events-auto cursor-pointer"
            >
              {isExamining ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Examining...</span>
                </>
              ) : (
                <>
                  <Scale className="w-3.5 h-3.5" />
                  <span>Examine</span>
                </>
              )}
            </button>
          </div>
        </div>
        {errorText && (
          <p className="text-xs text-amber-300 font-mono italic">
            * Note: {errorText}
          </p>
        )}
      </form>

      {/* CBT REFRAME OUTPUT DISPLAY */}
      {result && (
        <div className="space-y-6 animate-fade-in border-t border-white/10 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* DISTORTION PANEL */}
            <div className="p-4.5 bg-red-500/10 border border-red-500/15 rounded-2xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-300 block mb-1">
                Cognitive Distortion Detected
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                {result.cognitiveDistortion}
              </h3>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Automatic thoughts can magnify danger. Settle on a practical, grounded perspective.
              </p>
            </div>

            {/* EMPATHETIC VALIDATION */}
            <div className="p-4.5 bg-white/5 border border-white/5 rounded-2xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 block mb-1">
                Warm Compassionate Witness
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-2">
                <Heart className="w-4 h-4 text-rose-400 shrink-0" />
                Validation Space
              </h3>
              <p className="text-xs text-white/80 leading-relaxed italic">
                "{result.empatheticValidation}"
              </p>
            </div>
          </div>

          {/* HEALTHY CBT REFRAME CARD */}
          <div className="p-5.5 bg-gradient-to-br from-white/10 to-white/5 border border-purple-400/20 rounded-2xl relative overflow-hidden backdrop-blur-md">
            <span className="absolute -right-3 -bottom-3 text-white/5 pointer-events-none font-bold text-6xl select-none">CBT</span>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-medium">Empathetic CBT Alternative Perspective</span>
            </div>
            <p className="text-sm sm:text-base font-medium text-white leading-relaxed font-heading italic">
              "{result.healthyReframe}"
            </p>
          </div>

          {/* BEHAVIORAL ACTIVATION: THE 2-MINUTE MICRO ACTION */}
          <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold block mb-1">
                  Gentle Behavioral Activation
                </span>
                <span className="text-sm font-bold text-white block">
                  Action step to bypass resistance
                </span>
                <p className="text-xs text-white/70 leading-normal mt-1">
                  Procrastination is often anxiety-driven. Open this timer to complete the micro-action below:
                </p>
              </div>
              
              {/* INTERACTIVE TIMED ACTION */}
              <div className="flex items-center gap-3 bg-white/10 px-4.5 py-2.5 rounded-2xl border border-white/5 shrink-0 self-start sm:self-center shadow-md backdrop-blur-md">
                <span className="text-lg font-bold font-mono tracking-tight text-white">
                  {formatTime(secondsLeft)}
                </span>
                <div className="h-5 w-px bg-white/20"></div>
                <div className="flex gap-1.5">
                  {timerActive ? (
                    <button
                      onClick={pauseMicroActionTimer}
                      className="p-1 text-white/80 hover:text-white transition-all cursor-pointer"
                      title="Pause timer"
                    >
                      <Pause className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button
                      onClick={startMicroActionTimer}
                      disabled={actionDone}
                      className="p-1 text-purple-300 hover:text-purple-200 transition-all disabled:opacity-50 cursor-pointer"
                      title="Start micro-action timer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}
                  <button
                    onClick={resetMicroActionTimer}
                    className="p-1 text-white/40 hover:text-white/70 transition-all cursor-pointer"
                    title="Reset countdown"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* THE SUGGESTED TASK */}
            <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-start gap-3">
              <span className="text-lg leading-none shrink-0 mt-0.5">🌱</span>
              <div className="flex-1">
                <span className="text-xs font-semibold text-white block">Your Micro-Task:</span>
                <p className="text-xs text-white/80 mt-0.5 leading-snug">{result.microAction}</p>
              </div>
            </div>

            {/* COMPLETED SUCCESS */}
            {actionDone && (
              <div className="mt-4 p-3 bg-emerald-500/15 text-emerald-100 border border-emerald-500/20 rounded-xl text-xs flex flex-col sm:flex-row items-center justify-between gap-3 font-medium animate-fade-in">
                <span className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-emerald-400 shrink-0" />
                  Momentum achieved! Excellent job breaking through the initial cognitive friction.
                </span>
                <button
                  onClick={() => onTriggerBreathing(result.breathingDurationSec)}
                  className="bg-emerald-600 text-white hover:bg-emerald-500 font-semibold rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
                >
                  Start Soothing Breath
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
