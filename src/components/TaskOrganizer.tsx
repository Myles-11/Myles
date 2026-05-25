import React, { useState } from "react";
import { ListTodo, Sparkles, BrainCircuit, Activity, Clock, CheckCircle, Plus, Info, Coffee, HelpCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Task, TaskRole } from "../types";

interface TaskOrganizerProps {
  tasks: Task[];
  onSetTasks: (tasks: Task[]) => void;
  onToggleTaskCompleted: (id: string) => void;
  onAddTask: (task: Task) => void;
  onStartTimer: (durationMin: number) => void;
}

const LINT_PREPARATION_TASKS = [
  "Draft presentation slides for marketing review",
  "Feeling extremely anxious about project signoff",
  "Buy dynamic grocer products, plan cooking dinner",
  "Schedule water micro-break to move muscles"
];

export default function TaskOrganizer({
  tasks,
  onSetTasks,
  onToggleTaskCompleted,
  onAddTask,
  onStartTimer,
}: TaskOrganizerProps) {
  const [brainDump, setBrainDump] = useState<string>("");
  const [isOrganizing, setIsOrganizing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");

  // Manual fast add task controls
  const [manualTitle, setManualTitle] = useState<string>("");
  const [manualType, setManualType] = useState<TaskRole>("focus");
  const [manualDuration, setManualDuration] = useState<number>(30);
  const [showManualForm, setShowManualForm] = useState<boolean>(false);

  // Re-organize Brain dump trigger
  const handleAIReorganize = async () => {
    if (!brainDump.trim()) {
      setErrorText("Please write down a chaotic list or thoughts first to reorganize.");
      return;
    }

    setIsOrganizing(true);
    setErrorText("");
    
    // Stagger loading messages for emotional delight and visual polish
    const steps = [
      "Decongesting raw sensory brain dump...",
      "Extracting cognitive goals and priority targets...",
      "Interleaving restorative 4-7-8 deep breathing breaks...",
      "Finalizing structured cortisol-conscious schedule..."
    ];

    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const stepInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setLoadingStep(steps[stepIdx]);
      }
    }, 1500);

    try {
      const res = await fetch("/api/wellbeing/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brainDump }),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        throw new Error("Failed to consult Gemini. Fallback activated.");
      }

      const data = await res.json();
      if (data.tasks && Array.isArray(data.tasks)) {
        // Enforce completed default state
        const fullyMapped = data.tasks.map((t: any) => ({
          ...t,
          completed: false,
        }));
        onSetTasks(fullyMapped);
        setBrainDump("");
      } else {
        throw new Error("Invalid format from schedule processor.");
      }
    } catch (err: any) {
      console.warn(err);
      setErrorText("Our schedule gateway is congested. Loaded fallback balanced stress-free routines instead.");
      // Standard robust fallback
      const fallbackTasks: Task[] = [
        {
          id: "fb-1",
          title: "Align workspace focus priority",
          type: "focus",
          durationMin: 30,
          timeSlot: "09:30 - 10:00",
          description: "Perform the single most valuable work block with high mental focus.",
          stressImpact: "high",
          mindfulnessTip: "Mute your phone and hide browsers tabs. Take one full deep slow breath before you begin.",
          completed: false
        },
        {
          id: "fb-2",
          title: "Micro-Stillness reset",
          type: "break",
          durationMin: 10,
          timeSlot: "10:00 - 10:10",
          description: "Step away from computers. Try a box breathing repetition.",
          stressImpact: "low",
          mindfulnessTip: "Notice three colors around your room to anchor visual attention.",
          completed: false
        },
        {
          id: "fb-3",
          title: "Address low-friction chores",
          type: "maintenance",
          durationMin: 45,
          timeSlot: "10:10 - 10:55",
          description: "Catch up on email sorting, inbox housekeeping, or mechanical chores.",
          stressImpact: "medium",
          mindfulnessTip: "Drop your shoulders and unclench your jaw while typing.",
          completed: false
        }
      ];
      onSetTasks(fallbackTasks);
    } finally {
      setIsOrganizing(false);
      setLoadingStep("");
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    const newTask: Task = {
      id: "task_man_" + Date.now(),
      title: manualTitle.trim(),
      type: manualType,
      durationMin: Number(manualDuration),
      timeSlot: "Flexible",
      description: "Custom self-scheduled action slot.",
      stressImpact: manualType === "focus" ? "high" : "low",
      mindfulnessTip: "Take high intent pauses. Keep your breathing deep.",
      completed: false
    };

    onAddTask(newTask);
    setManualTitle("");
    setShowManualForm(false);
  };

  const getTaskStyles = (type: TaskRole) => {
    switch (type) {
      case "focus":
        return {
          theme: "border-purple-500/15 bg-white/5 text-white",
          accentLine: "bg-purple-400",
          iconBg: "bg-purple-500/10 text-purple-300"
        };
      case "break":
        return {
          theme: "border-blue-500/15 bg-white/5 border-dashed text-white",
          accentLine: "bg-blue-400",
          iconBg: "bg-blue-500/10 text-blue-300"
        };
      case "maintenance":
        return {
          theme: "border-white/10 bg-white/5 text-white",
          accentLine: "bg-white/30",
          iconBg: "bg-white/10 text-white/70"
        };
    }
  };

  const loadRandomPrompt = () => {
    const randoms = [
      "Need to prepare for team demo, call bank regarding credit card, clean dish rack, feeling so nervous about slide presentation.",
      "Clear emails, write project brief, write groceries list (need avocado, paper towel), wash running shoes, feeling incredibly distracted.",
      "Fix git push bug, reply to marketing messages, wash sheets, stretch lower back, schedule water intake, panicking about timeline."
    ];
    setBrainDump(randoms[Math.floor(Math.random() * randoms.length)]);
  };

  return (
    <div id="task-organizer" className="glass-panel p-6 md:p-8 text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/15 rounded-xl text-blue-400 border border-blue-500/20 animate-pulse">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Structured Routine Studio</h2>
            <p className="text-xs text-white/60">Break free from paralysis by mapping chores alongside calming buffers</p>
          </div>
        </div>
        <button
          onClick={() => setShowManualForm(!showManualForm)}
          className="text-xs font-semibold bg-white/10 text-white hover:bg-white/15 px-3.5 py-2 rounded-full transition-all border border-white/5 self-start sm:self-auto cursor-pointer"
        >
          {showManualForm ? "Hide Form" : "+ Manual Add"}
        </button>
      </div>

      {/* BRAIN DUMP BOX */}
      <div className="mb-8 p-5 bg-white/5 rounded-2xl border border-white/5">
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-mono uppercase tracking-wider text-white/80 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-400 animate-pulse" />
            Chaos Brain-Dump Console
          </label>
          <div className="flex gap-2">
            <button
              onClick={loadRandomPrompt}
              className="text-[11px] font-mono text-purple-300 hover:text-purple-200 hover:underline transition-all"
            >
              Draft Example
            </button>
          </div>
        </div>
        <textarea
          value={brainDump}
          onChange={(e) => setBrainDump(e.target.value)}
          rows={3}
          placeholder="Free-write everything inside your head right now... your chores, distractions, worries or small admin details. Let Gemini's executive scheduling model isolate priorities, sequence actions, and plant restorative deep breathing blocks."
          className="w-full text-xs sm:text-sm bg-white/5 border border-white/10 text-white focus:border-purple-400/50 placeholder-white/25 transition-all rounded-xl p-4.5 focus:outline-none"
        />

        {errorText && (
          <div className="mt-3.5 text-xs text-amber-300 font-medium flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorText}</span>
          </div>
        )}

        <div className="mt-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <p className="text-[11px] text-white/60 max-w-sm">
            Alternating focus intervals with structured breaks protects your energy.
          </p>
          <button
            onClick={handleAIReorganize}
            disabled={isOrganizing}
            className={`flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full text-xs shadow-lg shadow-blue-500/10 transition-all shrink-0 cursor-pointer ${
              isOrganizing ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isOrganizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{loadingStep || "Analyzing routine..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Organize Mindful Schedule with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* MANUAL TASK FORM */}
      {showManualForm && (
        <form onSubmit={handleManualAdd} className="mb-6 p-4.5 border border-white/10 bg-white/5 rounded-2xl space-y-3.5 animate-fade-in text-white">
          <p className="text-xs font-semibold text-white">Add Custom Checklist Item</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Task title..."
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400/50 text-white placeholder-white/30"
            />
            <select
              value={manualType}
              onChange={(e) => setManualType(e.target.value as TaskRole)}
              className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none text-white [&>option]:bg-[#0B0F19]"
            >
              <option value="focus">Focus Block</option>
              <option value="break">Mindful Break</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">Duration (min):</span>
              <input
                type="number"
                min="5"
                max="120"
                value={manualDuration}
                onChange={(e) => setManualDuration(Number(e.target.value))}
                className="w-16 text-xs bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 focus:outline-none text-center text-white"
              />
            </div>
            <button
              type="submit"
              className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full text-xs transition-all border border-blue-400/20 cursor-pointer"
            >
              Add Item
            </button>
          </div>
        </form>
      )}

      {/* SCHEDULED BULLETS LIST */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-white/70">Daily Balance Route</span>
          <span className="text-[11px] font-mono text-white/60">
            {tasks.filter((t) => t.completed).length}/{tasks.length} Completed
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-white/10 bg-white/5 text-white">
            <ListTodo className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed">
              No daily tasks configured. Enter your brain dump inside the console above and press <strong>Organize Schedule</strong> to see AI auto-structure your day safely!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const styles = getTaskStyles(task.type);
              return (
                <div
                  key={task.id}
                  className={`group relative rounded-2xl border p-4.5 transition-all duration-300 flex flex-col sm:flex-row sm:items-start gap-4 ${styles.theme} ${
                    task.completed ? "opacity-40 bg-white/5 border-white/5" : "hover:border-white/20 shadow"
                  }`}
                >
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 rounded-l-2xl ${styles.accentLine}`}></div>

                  {/* CHECKBOX */}
                  <label className="flex items-center justify-center shrink-0 mt-0.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onToggleTaskCompleted(task.id)}
                      className="sr-only"
                    />
                    <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                      task.completed 
                        ? "bg-emerald-600 border-emerald-500 text-white" 
                        : "border-purple-400/50 hover:border-purple-400 bg-white/5"
                    }`}>
                      {task.completed && <CheckCircle className="w-5 h-5 text-white fill-current" />}
                    </div>
                  </label>

                  {/* INFO AND TEXT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md ${
                        task.type === "focus" 
                          ? "bg-purple-500/10 text-purple-300 border border-purple-500/10 font-bold" 
                          : task.type === "break"
                          ? "bg-blue-500/10 text-blue-300 border border-blue-500/10 font-bold"
                          : "bg-white/10 text-white/70 border border-white/5"
                      }`}>
                        {task.type}
                      </span>
                      <span className="text-[11px] font-mono text-white/60 font-medium">
                        {task.timeSlot} ({task.durationMin} mins)
                      </span>
                      {task.stressImpact === "high" && !task.completed && (
                        <span className="text-[9px] font-mono font-bold uppercase py-0.5 px-1.5 bg-red-500/15 text-red-300 rounded border border-red-500/10">
                          High Cortisol
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm font-semibold text-white mb-1 leading-tight ${
                      task.completed ? "line-through text-white/40" : ""
                    }`}>
                      {task.title}
                    </h3>
                    <p className="text-xs text-white/70 leading-relaxed mb-3">{task.description}</p>

                    {/* MINDFULNESS TIP ACCENT BOX */}
                    {!task.completed && (
                      <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-white/80 leading-normal flex items-start gap-2 italic">
                        <Sparkles className="w-3 h-3 text-amber-300 shrink-0 mt-0.5" />
                        <span><strong>Tip:</strong> {task.mindfulnessTip}</span>
                      </div>
                    )}
                  </div>

                  {/* ACTION CONTROLS */}
                  {!task.completed && (
                    <div className="shrink-0 flex sm:flex-col justify-end items-end gap-2 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-white/10">
                      <button
                        onClick={() => onStartTimer(task.durationMin)}
                        className="flex items-center gap-1.5 text-[10px] font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                        title="Focus with a micro countdown timer"
                      >
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span>Start Interval</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
