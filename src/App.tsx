import React, { useState, useEffect } from "react";
import { 
  Sparkles, Heart, Clock, ListTodo, Bot, Scale, Smile, Activity, 
  HelpCircle, ExternalLink, Moon, Compass, Award, ShieldCheck, ShieldAlert 
} from "lucide-react";

import { Task, MoodLog } from "./types";
import BreathingGuide from "./components/BreathingGuide";
import MoodLogger from "./components/MoodLogger";
import TaskOrganizer from "./components/TaskOrganizer";
import CbtReframe from "./components/CbtReframe";
import SolaceCompanion from "./components/SolaceCompanion";
import DashboardInsights from "./components/DashboardInsights";

export default function App() {
  // Workspace tabs
  const [activeTab, setActiveTab] = useState<"routine" | "breath" | "cbt" | "chat">("routine");

  // Gateway status check
  const [apiStatus, setApiStatus] = useState<{ hasApiKey: boolean; message: string }>({
    hasApiKey: false,
    message: "Verifying connection to AI services..."
  });

  // Emotional Lab Logs State
  const [logs, setLogs] = useState<MoodLog[]>(() => {
    const cached = localStorage.getItem("app_mood_logs");
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
    return [
      {
        id: "init-log",
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
        mood: "neutral",
        value: 3,
        energy: 3,
        stress: 4,
        note: "Checking out the Well-being platform. Day is extremely busy and chaotic."
      }
    ];
  });

  // Task list state
  const [tasks, setTasks] = useState<Task[]>(() => {
    const cached = localStorage.getItem("app_mindful_tasks");
    if (cached) {
      try { return JSON.parse(cached); } catch(e) {}
    }
    return [
      {
        id: "seed-1",
        title: "Log initial emotional vibe inside the Lab",
        type: "maintenance",
        durationMin: 10,
        timeSlot: "09:00 - 09:10",
        description: "Open the Feeling Lab and measure stress, valence and physical resilience.",
        stressImpact: "low",
        mindfulnessTip: "Check your physical posture while you complete your evaluation.",
        completed: false
      },
      {
        id: "seed-2",
        title: "Begin deep strategic work sprint",
        type: "focus",
        durationMin: 45,
        timeSlot: "09:10 - 09:55",
        description: "Devote entire focus to high prio work targets. Hide phone and mute workspace tabs.",
        stressImpact: "high",
        mindfulnessTip: "Take 3 deep tummy breaths sitting up straight before placing finger on keyboard.",
        completed: false
      },
      {
        id: "seed-3",
        title: "Pranayama box breathing micro-break",
        type: "break",
        durationMin: 10,
        timeSlot: "09:55 - 10:05",
        description: "Calm brain activity. Open the Breathing circular guide and repeat times.",
        stressImpact: "low",
        mindfulnessTip: "Fix eyes on the expanding circle and relax neck muscles.",
        completed: false
      }
    ];
  });

  // Active interval micro-timer states
  const [focusTaskTitle, setFocusTaskTitle] = useState<string | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerIsRunning, setTimerIsRunning] = useState<boolean>(false);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("app_mood_logs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("app_mindful_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Query AI API Status on startup
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch("/api/wellbeing/status");
        if (res.ok) {
          const data = await res.json();
          setApiStatus(data);
        } else {
          setApiStatus({
            hasApiKey: false,
            message: "Server is online. Falling back to local/static responses until configured in Secrets."
          });
        }
      } catch (err) {
        setApiStatus({
          hasApiKey: false,
          message: "Unable to reach server. Operating inside client wellness model."
        });
      }
    };
    checkStatus();
  }, []);

  // Timer interval hook
  useEffect(() => {
    let handle: NodeJS.Timeout | null = null;
    if (timerIsRunning && timerSecondsLeft > 0) {
      handle = setInterval(() => {
        setTimerSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (timerSecondsLeft === 0 && timerIsRunning) {
      setTimerIsRunning(false);
      alert(`Interval complete for: ${focusTaskTitle || "Active focus block"}! Remember to take a mindful micro-break.`);
      setFocusTaskTitle(null);
    }

    return () => {
      if (handle) clearInterval(handle);
    };
  }, [timerIsRunning, timerSecondsLeft, focusTaskTitle]);

  // Mood Log Callback
  const handleAddLog = (newLog: MoodLog) => {
    setLogs((prev) => [...prev, newLog]);
  };

  // Task Organizers callbacks
  const handleToggleTaskCompleted = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleAddTask = (newTask: Task) => {
    setTasks((prev) => [...prev, newTask]);
  };

  const handleStartTimer = (durationMin: number) => {
    setFocusTaskTitle("Active Mindful Interval");
    setTimerSecondsLeft(durationMin * 60);
    setTimerIsRunning(true);
  };

  const triggerBreathingFromCbt = (seconds: number) => {
    setActiveTab("breath");
    // Suggested breathing will highlight directly in the Breathing module
  };

  // Helper formatting timing
  const formatTimerString = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Current formatted physical Date
  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div id="wellbeing-app" className="min-h-screen background-cosmos flex flex-col selection:bg-purple-500/30 select-none antialiased text-white">
      {/* GLOBAL BANNER IF AI KEY IS MISSING */}
      {!apiStatus.hasApiKey && (
        <div className="bg-gradient-to-r from-purple-800/40 via-blue-900/40 to-indigo-950/40 backdrop-blur-md text-slate-200 font-medium px-4 py-2.5 text-center text-xs flex items-center justify-center gap-2 border-b border-white/5 italic">
          <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
          <span>Demoing with safe localized logic. Add `GEMINI_API_KEY` in **Settings &gt; Secrets** to activate unlimited, tailored AI counsel and schedulers!</span>
        </div>
      )}

      {/* CORE HEADER */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-lg sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 border border-blue-400/20 text-white rounded-2xl shadow-md">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-white">Mindful Daily Assistant</h1>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-white/60 font-medium">{getFormattedDate()}</span>
                <span className="h-3 w-px bg-white/10"></span>
                {apiStatus.hasApiKey ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    AI Services Online
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-400 animate-pulse" />
                    Interactive Sandbox Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE GOAL INTERVAL TIMER */}
          {focusTaskTitle && (
            <div className="bg-white/5 border border-white/15 backdrop-blur-md py-2 px-4.5 rounded-2xl flex items-center gap-3 shadow-md animate-fade-in text-white">
              <div className="relative flex items-center justify-center w-7 h-7">
                <Clock className="w-5 h-5 text-purple-400 animate-spin-slow" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 block">Active Sprint</span>
                <span className="text-xs font-bold text-white block truncate max-w-40">{focusTaskTitle}</span>
              </div>
              <div className="h-6 w-px bg-white/10"></div>
              <span className="text-sm font-black font-mono tracking-tight text-purple-200">
                {formatTimerString(timerSecondsLeft)}
              </span>
              <button
                onClick={() => setTimerIsRunning(!timerIsRunning)}
                className="text-[10px] font-semibold bg-white/10 text-white hover:bg-white/20 px-2.5 py-1 rounded transition-all cursor-pointer"
              >
                {timerIsRunning ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => { setFocusTaskTitle(null); setTimerIsRunning(false); }}
                className="text-[10px] text-red-400 hover:text-red-300 transition-all cursor-pointer px-1"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN SCREEN GRID LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col gap-8 w-full">
        
        {/* TOP ROW: FEELINGS AND GRAPHIC STATS IN SAME ROW FOR BALANCED VISUAL VALUE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-12">
            <div className="p-1.5 bg-white/5 border border-white/10 rounded-2xl flex justify-start items-center gap-1 sm:gap-2 overflow-x-auto w-fit backdrop-blur-md">
              <button
                onClick={() => setActiveTab("routine")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeTab === "routine"
                    ? "bg-white/15 text-white shadow-lg shadow-black/10 border border-white/15"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                <ListTodo className="w-4 h-4" />
                <span>Routine & Day Checklist</span>
              </button>
              <button
                onClick={() => setActiveTab("breath")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeTab === "breath"
                    ? "bg-white/15 text-white shadow-lg shadow-black/10 border border-white/15"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Breathing Sanctuary</span>
              </button>
              <button
                onClick={() => setActiveTab("cbt")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeTab === "cbt"
                    ? "bg-white/15 text-white shadow-lg shadow-black/10 border border-white/15"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>CBT Thought Lab</span>
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  activeTab === "chat"
                    ? "bg-white/15 text-white shadow-lg shadow-black/10 border border-white/15"
                    : "text-white/60 hover:text-white/80"
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>Solace Support Chat</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-7">
            {/* WORKSPACE VIEWS */}
            {activeTab === "routine" && (
              <TaskOrganizer
                tasks={tasks}
                onSetTasks={setTasks}
                onToggleTaskCompleted={handleToggleTaskCompleted}
                onAddTask={handleAddTask}
                onStartTimer={handleStartTimer}
              />
            )}

            {activeTab === "breath" && (
              <BreathingGuide 
                onSessionComplete={(sec) => {
                  // Add log on session finish
                  handleAddLog({
                    id: "log_b_" + Date.now(),
                    timestamp: new Date().toISOString(),
                    mood: "peaceful",
                    value: 4,
                    energy: 4,
                    stress: 2,
                    note: "Completed a rejuvenating Breathing practice session."
                  });
                }}
              />
            )}

            {activeTab === "cbt" && (
              <CbtReframe onTriggerBreathing={triggerBreathingFromCbt} />
            )}

            {activeTab === "chat" && (
              <SolaceCompanion />
            )}
          </div>

          {/* SIDEBAR: EMOTIONAL LAB CARD TO ACCUMULATE INSIGHTS QUICKLY */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6">
            <MoodLogger onAddLog={handleAddLog} logs={logs} />
          </div>
        </section>

        {/* ANALYTICS SECTION */}
        <section className="border-t border-white/10 pt-8">
          <DashboardInsights logs={logs} tasks={tasks} />
        </section>

        {/* HUMBLE ACCENT FOOTER FOR COMPOSURE */}
        <footer className="mt-auto border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
          <p>© 2026 Mindful Daily Assistant. Supporting focus and clinical mindfulness.</p>
          <div className="flex gap-4 font-mono">
            <span>Client-side Storage Enabled</span>
            <span>•</span>
            <span>Gemini LLM Active</span>
          </div>
        </footer>

      </main>
    </div>
  );
}
