import React from "react";
import { AreaChart, Shield, LayoutGrid, Heart, Flame, Sparkles, Smile, Footprints, Clock, CheckSquare } from "lucide-react";
import { MoodLog, Task } from "../types";

interface DashboardInsightsProps {
  logs: MoodLog[];
  tasks: Task[];
}

export default function DashboardInsights({ logs, tasks }: DashboardInsightsProps) {
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const taskRatio = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // Retrieve total breathing sessions from local storage
  const completedBreathingSessions = Number(localStorage.getItem("breathing_sessions_count") || "0");
  const totalBreathingMinutes = completedBreathingSessions * 2; // Each completed standard breathing loop registers ~2 minutes

  // Calculate stress average Index
  const averageStress = logs.length > 0 
    ? (logs.reduce((acc, curr) => acc + curr.stress, 0) / logs.length).toFixed(1)
    : "3.0";

  // Calculate feeling average index
  const averageMoodValue = logs.length > 0
    ? (logs.reduce((acc, curr) => acc + curr.value, 0) / logs.length).toFixed(1)
    : "3.3";

  // Formulate helpful context depending on mood values
  const getMindfulnessVerdict = () => {
    const stressNum = Number(averageStress);
    const moodNum = Number(averageMoodValue);

    if (logs.length === 0) {
      return "Unlock personalized mental reports and fatigue curves by logging your emotional temperature in the Lab above.";
    }

    if (stressNum >= 3.8) {
      return "Cortisol load is elevated. Research recommends stopping all fast actions. Complete a standard 4-7-8 Breathing interval now.";
    }
    if (moodNum >= 4.0) {
      return "You are in an inspired, high-valence zone. Channel this cognitive freshness to complete intense Focus Blocks seamlessly.";
    }
    return "Nervous energy is currently balanced. Pace tasks with short periodic walking or hydration intervals to avoid saturation.";
  };

  // Safe SVG coordinates generator for Mood Timeline
  const renderSVGGraph = () => {
    if (logs.length < 2) {
      return (
        <div className="h-44 flex flex-col items-center justify-center bg-white/5 rounded-2xl border border-white/10 border-dashed text-white/60 p-4 text-center">
          <AreaChart className="w-5 h-5 text-white/20 mb-2 animate-pulse" />
          <p className="text-[11px] leading-normal font-sans text-white/55 max-w-xs">
            Plotting requires at least <strong>{2 - logs.length} more logs</strong> to extrapolate your daily emotional wave.
          </p>
        </div>
      );
    }

    // Take last 7 logs
    const activeData = logs.slice(-7);
    const height = 100;
    const width = 360;
    const padding = 20;

    const points = activeData.map((log, index) => {
      const x = padding + (index * (width - padding * 2)) / (activeData.length - 1);
      // log.value is 1-5 scale. Map to height: 1 -> height-padding, 5 -> padding
      const y = height - padding - ((log.value - 1) * (height - padding * 2)) / 4;
      return { x, y, ...log };
    });

    const dPath = points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, "");

    return (
      <div className="mt-2 bg-white/5 p-3 rounded-2xl border border-white/10">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 overflow-visible">
          {/* Horizontal Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 4" />

          {/* Core Curve */}
          <path d={dPath} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Nodes */}
          {points.map((p, i) => (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r="5" className="fill-[#60a5fa] hover:r-6 cursor-pointer stroke-[#0d1527] stroke-2" />
              <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[9px] font-mono tracking-tighter fill-white font-bold">
                {p.value}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex justify-between px-4 mt-1 text-[9px] font-mono text-white/40">
          <span>{new Date(activeData[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="italic">Emotional wave direction</span>
          <span>{new Date(activeData[activeData.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    );
  };

  return (
    <div id="dynamic-insights" className="glass-panel p-6 md:p-8 text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-500/15 rounded-xl text-blue-400 border border-blue-500/20">
          <AreaChart className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">Vigilance & Growth Analytics</h2>
          <p className="text-xs text-white/60">Decipher somatic patterns and daily complete checklists</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* CHART INDEX CARD: CHORES */}
        <div className="p-4.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-white/20 transition-all">
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="23" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4.5" />
              <circle
                cx="28"
                cy="28"
                r="23"
                fill="transparent"
                stroke="#c084fc"
                strokeWidth="4.5"
                strokeDasharray={144}
                strokeDashoffset={144 - 144 * taskRatio}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <span className="text-xs font-bold font-mono text-white">
              {(taskRatio * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#c084fc] block">Chore Completed</span>
            <span className="text-lg font-bold text-white font-heading">
              {completedTasks} <span className="text-xs text-white/40 font-normal">/ {totalTasks}</span>
            </span>
            <p className="text-[10px] text-white/60 leading-normal mt-0.5">Tasks scheduled with mindfulness markers.</p>
          </div>
        </div>

        {/* CHART INDEX CARD: MINUTES */}
        <div className="p-4.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3.5 hover:border-white/20 transition-all">
          <div className="p-3 bg-purple-500/10 text-purple-300 border border-purple-500/10 rounded-xl shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 block">Stillness Reserves</span>
            <span className="text-lg font-bold text-white font-heading">
              {totalBreathingMinutes} <span className="text-xs text-white/40 font-normal">minutes</span>
            </span>
            <p className="text-[10px] text-white/60 leading-normal mt-0.5">Time logged regulating autonomic nervous state.</p>
          </div>
        </div>

        {/* CHART INDEX CARD: STRESS AVERAGE */}
        <div className="p-4.5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3.5 hover:border-white/20 transition-all">
          <div className="p-3 bg-red-500/10 text-red-300 border border-red-500/10 rounded-xl shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-300 block">Stress Pressure</span>
            <span className="text-lg font-bold text-white font-heading">
              {averageStress} <span className="text-xs text-white/40 font-normal">/ 5.0</span>
            </span>
            <p className="text-[10px] text-white/60 leading-normal mt-0.5">Average calculated anxiety coefficient.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* GRAPH PANEL */}
        <div className="flex flex-col">
          <span className="text-xs font-mono uppercase tracking-wider text-white/70 block mb-2">Feeling Wave Trend</span>
          <div className="flex-1">
            {renderSVGGraph()}
          </div>
        </div>

        {/* COMPASS COMPANION REPORT BOX */}
        <div className="p-5.5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-blue-300 font-extrabold flex items-center gap-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
              INTELLIGENT COMPASS ADVISORY
            </span>
            <p className="text-sm font-semibold text-white leading-snug mb-3">
              Daily Well-being Rating: <strong className="text-blue-400 font-heading">{averageMoodValue}/5.0</strong>
            </p>
            <p className="text-xs text-white/80 leading-relaxed italic">
              "{getMindfulnessVerdict()}"
            </p>
          </div>
          
          <div className="mt-6 p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/70 flex items-center gap-2 font-mono">
            <Footprints className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Integrate short breathing pauses to stay stable.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
