import React, { useState, useEffect, useRef } from "react";
import { Smile, Zap, Flame, PenTool, Check, Compass, Sparkles, BookOpen, Play, Pause } from "lucide-react";
import { MoodLog } from "../types";
import AudioRecorder from "./AudioRecorder";

interface MoodLoggerProps {
  onAddLog: (log: MoodLog) => void;
  logs: MoodLog[];
}

const MOODS = [
  { value: "very_anxious", rating: 1, label: "Awful / Stress", emoji: "😖", color: "bg-red-500/15 border-red-500/25 text-red-300" },
  { value: "anxious", rating: 2, label: "Tense / Busy", emoji: "😰", color: "bg-orange-500/15 border-orange-500/25 text-orange-300" },
  { value: "neutral", rating: 3, label: "Neutral / Balanced", emoji: "😐", color: "bg-blue-500/15 border-blue-500/25 text-blue-300" },
  { value: "peaceful", rating: 4, label: "Peaceful / Calm", emoji: "😌", color: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300" },
  { value: "joyful", rating: 5, label: "Inspired / Joy", emoji: "☀️", color: "bg-amber-500/15 border-amber-500/25 text-amber-300" },
];

// Custom log audio player for inline lists
function LogAudioPlayer({ src, duration }: { src: string; duration: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playerRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (playerRef.current) playerRef.current.pause();
    };
  }, []);

  const toggle = () => {
    if (!playerRef.current) {
      playerRef.current = new Audio(src);
      playerRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
        if (progressRef.current) clearInterval(progressRef.current);
      };
    }

    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
      if (progressRef.current) clearInterval(progressRef.current);
    } else {
      playerRef.current.play().then(() => {
        setIsPlaying(true);
        progressRef.current = setInterval(() => {
          if (playerRef.current) {
            setPlaybackTime(playerRef.current.currentTime);
          }
        }, 100);
      }).catch((e) => {
        console.error("Timeline playback failed:", e);
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-2.5 p-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-3 text-white">
      <button
        type="button"
        onClick={toggle}
        className="p-1 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
      >
        {isPlaying ? <Pause className="w-2.5 h-2.5 animate-pulse" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
        <span>{isPlaying ? "Pause Memo" : "Play Voice Note"}</span>
      </button>
      <span className="text-[10px] font-mono text-white/50">
        {formatTime(playbackTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}

export default function MoodLogger({ onAddLog, logs }: MoodLoggerProps) {
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[2]>(MOODS[2]);
  const [energy, setEnergy] = useState<number>(3);
  const [stress, setStress] = useState<number>(3);
  const [note, setNote] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined);
  const [audioDuration, setAudioDuration] = useState<number | undefined>(undefined);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Key to force resetting/clearing AudioRecorder on submit
  const [audioResetKey, setAudioResetKey] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newLog: MoodLog = {
      id: "log_" + Date.now(),
      timestamp: new Date().toISOString(),
      mood: selectedMood.value as MoodLog["mood"],
      value: selectedMood.rating,
      energy,
      stress,
      note: note.trim(),
      audioUrl: audioUrl,
      audioDuration: audioDuration,
    };

    onAddLog(newLog);
    setNote("");
    setAudioUrl(undefined);
    setAudioDuration(undefined);
    // Reset key to unmount and clear internal state of recording component
    setAudioResetKey((prev) => prev + 1);
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  const handleAudioSave = (base64: string, durationSec: number) => {
    setAudioUrl(base64);
    setAudioDuration(durationSec);
  };

  const handleAudioClear = () => {
    setAudioUrl(undefined);
    setAudioDuration(undefined);
  };

  return (
    <div id="mood-logger" className="glass-panel p-6 md:p-8 text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-500/15 rounded-xl text-blue-400 border border-blue-500/20">
          <Smile className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">Emotional Temperature Lab</h2>
          <p className="text-xs text-white/60">Log your active psychological state to uncover energy patterns</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* MOOD EMOTION BUTTONS */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-white/80 mb-3">
            How is your mind feeling right now?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {MOODS.map((m) => {
              const isSelected = selectedMood.value === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setSelectedMood(m)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all text-center cursor-pointer ${
                    isSelected
                      ? `${m.color} ring-2 ring-blue-500/30 font-semibold scale-102`
                      : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                  }`}
                >
                  <span className="text-2xl mb-1.5 filter drop-shadow-sm">{m.emoji}</span>
                  <span className="text-[11px] leading-tight font-medium">{m.label.split(" / ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ENERGY AND STRESS SLIDERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 p-4 border border-white/10 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                Mental Energy: <strong className="font-sans text-[13px] text-white">{energy}/5</strong>
              </label>
              <span className="text-[10px] text-white/60 italic">
                {energy <= 2 ? "Sluggish/Tired" : energy === 3 ? "Balanced" : "Charged/Sharp"}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-2.5 font-mono">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          <div className="bg-white/5 p-4 border border-white/10 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-300" />
                Stress Level: <strong className="font-sans text-[13px] text-white">{stress}/5</strong>
              </label>
              <span className="text-[10px] text-white/60 italic">
                {stress <= 2 ? "Soothed/Relaxed" : stress === 3 ? "Manageable" : "Overstimulated"}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
              className="w-full accent-purple-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-white/40 mt-3 font-mono">
              <span>Peaceful</span>
              <span>Moderate</span>
              <span>Stressed</span>
            </div>
          </div>
        </div>

        {/* VOICE RECORDER ATTACH INTERACTION */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-white/80 mb-2">
            Record Audio Entry (Voice Memo Component)
          </label>
          <div key={audioResetKey}>
            <AudioRecorder
              onAudioSave={handleAudioSave}
              onAudioClear={handleAudioClear}
            />
          </div>
        </div>

        {/* GRATITUDE NOTEPAD */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-white/80 mb-2 flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-purple-300" />
            Empathetic Context or Gratitude Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Jot down a chaotic thought, what you are current resisting, or one micro-thing you are grateful for..."
            className="w-full text-sm ring-offset-white placeholder-white/20 bg-white/5 border border-white/10 text-white transition-all rounded-2xl p-4 focus:outline-none focus:border-blue-400/50"
          />
        </div>

        {/* LOG LOGGING BUTTON */}
        <div className="flex items-center justify-between pt-1 gap-4">
          <div className="text-xs text-white/50 max-w-[65%] leading-normal">
            Logs are saved locally inside your browser and mapped onto stress trackers.
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-all shadow-md shrink-0 border border-blue-400/20 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Store Log</span>
          </button>
        </div>
      </form>

      {/* CONFIRMATION NOTIFICATION */}
      {showSuccess && (
        <div className="mt-4 p-3 bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 rounded-2xl text-[12px] flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Daily feeling & audio saved. View changes reflected inside your Analytics panel below!</span>
        </div>
      )}

      {/* RECENT FEED TIMELINE LOGS LIST */}
      {logs.length > 0 && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-white/40" />
            <span className="text-xs font-mono uppercase tracking-wider text-white/70">Recent Emotional Context Logs</span>
          </div>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {logs.slice(-3).reverse().map((log) => {
              const matched = MOODS.find((m) => m.value === log.mood) || MOODS[2];
              return (
                <div key={log.id} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-xs flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <span className="text-lg leading-none shrink-0">{matched.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-white">{matched.label.split(" / ")[0]}</span>
                        <span className="text-[10px] font-mono text-white/40">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {log.note ? (
                        <p className="text-white/80 italic leading-snug">"{log.note}"</p>
                      ) : (
                        <p className="text-white/45">Session logged without additional notations.</p>
                      )}
                      
                      {/* Attached Audio Diary player inside list */}
                      {log.audioUrl && (
                        <LogAudioPlayer src={log.audioUrl} duration={log.audioDuration || 5} />
                      )}

                      <div className="flex gap-3 mt-2 text-[9px] font-mono text-white/50">
                        <span>Energy: <strong className="text-amber-400">{log.energy}/5</strong></span>
                        <span>Stress: <strong className="text-purple-300">{log.stress}/5</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
