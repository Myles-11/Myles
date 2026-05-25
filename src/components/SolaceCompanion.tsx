import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, Heart, Sparkles, AlertCircle, Trash2, ArrowRight, Mic, Play, Pause, Check } from "lucide-react";
import { ChatMessage } from "../types";
import AudioRecorder from "./AudioRecorder";

function ChatAudioPlayer({ src, duration }: { src: string; duration: number }) {
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

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
        console.error("Chat playback failed:", e);
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mt-2.5 p-2 bg-purple-950/40 border border-purple-500/10 rounded-xl flex items-center justify-between gap-3 text-white max-w-sm ml-auto">
      <button
        type="button"
        onClick={toggle}
        className="p-1 px-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-full text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
      >
        {isPlaying ? <Pause className="w-2.5 h-2.5 animate-pulse" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
        <span>{isPlaying ? "Pause" : "Play Voice Note"}</span>
      </button>
      <span className="text-[10px] font-mono text-purple-200/50">
        {formatTime(playbackTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}

const INITIAL_CONVO_PRESETS = [
  { text: "Guide me through an emergency grounding drill right now.", badge: "Panic Response" },
  { text: "I feel incredibly procrastinated or frozen by anxiety.", badge: "Task Paralysis" },
  { text: "Help me practice self-compassion for not being perfect today.", badge: "Inner Critic" },
];

export default function SolaceCompanion() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const cached = localStorage.getItem("solace_chat_history");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: "init-message",
        role: "assistant",
        content: "Warm greetings, my friend. I am **Solace**, your companion in stillness. I am here to hold a compassionate, non-judgmental space for your mind. Whether you are carrying overwhelming work anxiety, fighting an abrasive inner critic, or simply need to step off the sensory hamster wheel—what is passing through your heart today?",
        timestamp: new Date().toISOString(),
      },
    ];
  });

  const [input, setInput] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Voice recording state indicators
  const [showVoiceInput, setShowVoiceInput] = useState<boolean>(false);
  const [attachedAudioUrl, setAttachedAudioUrl] = useState<string | undefined>(undefined);
  const [attachedAudioDuration, setAttachedAudioDuration] = useState<number | undefined>(undefined);
  const [audioResetKey, setAudioResetKey] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    localStorage.setItem("solace_chat_history", JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (rawText: string, attachedAudio?: string, attachedDuration?: number) => {
    const textToSend = rawText.trim();
    if (!textToSend && !attachedAudio) return;

    const userMsg: ChatMessage = {
      id: "msg_" + Date.now() + "_user",
      role: "user",
      content: textToSend || "Sent a voice entry.",
      timestamp: new Date().toISOString(),
      audioUrl: attachedAudio,
      audioDuration: attachedDuration,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedAudioUrl(undefined);
    setAttachedAudioDuration(undefined);
    setAudioResetKey((prev) => prev * 1 + 1);
    setShowVoiceInput(false);
    setIsTyping(true);

    try {
      // Assemble full message narrative so Gemini has conversational memories
      const narrativeContext = [...messages, userMsg].slice(-8); // send last 8 exchanges

      const res = await fetch("/api/wellbeing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: narrativeContext }),
      });

      if (!res.ok) {
        throw new Error("Unable to consult Solace companion.");
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: "msg_" + Date.now() + "_bot",
        role: "assistant",
        content: data.text || "I am listening closely. However, my gateway node is congested. Deep breaths.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      console.warn(e);
      const errorMsg: ChatMessage = {
        id: "msg_" + Date.now() + "_err",
        role: "assistant",
        content: "I am entirely here with you, though my server gateway is temporarily sleepy. Let us focus together on taking a slow, calming inhale... holding for 4 counts... and gently letting it go.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = () => {
    if (window.confirm("Do you want to clear your conversation history?")) {
      const reset = [
        {
          id: "init-message",
          role: "assistant",
          content: "Convo cleared safely. I am ready to support your mind. What is currently weighing on you?",
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages(reset);
    }
  };

  // Safe formatting parser tool for markdown inside the chat bubble
  const renderMessageContent = (text: string) => {
    return text.split("\n").map((line, layoutIdx) => {
      let trimmed = line.trim();
      
      // Determine list elements
      const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
      if (isBullet) {
        const cleaned = trimmed.replace(/^[-*]\s+/, "");
        return (
          <li key={layoutIdx} className="ml-4 list-disc text-xs sm:text-sm text-white/80 leading-relaxed mb-1.5 font-sans">
            {parseBoldText(cleaned)}
          </li>
        );
      }

      // Check bullet numerical indexes
      const matchesNumeric = trimmed.match(/^\d+\.\s+/);
      if (matchesNumeric) {
        const cleaned = trimmed.replace(/^\d+\.\s+/, "");
        return (
          <li key={layoutIdx} className="ml-4 list-decimal text-xs sm:text-sm text-white/80 leading-relaxed mb-1.5 font-sans">
            {parseBoldText(cleaned)}
          </li>
        );
      }

      return (
        <p key={layoutIdx} className={`text-xs sm:text-sm text-white/80 leading-relaxed ${trimmed === "" ? "h-2" : "mb-3"} font-sans`}>
          {parseBoldText(line)}
        </p>
      );
    });
  };

  const parseBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-bold text-[#a78bfa]">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div id="solace-companion" className="glass-panel p-6 md:p-8 text-white flex flex-col h-[520px]">
      {/* COMPANION HEADER */}
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/15 rounded-xl text-blue-400 border border-blue-500/20">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">Solace Well-being Companion</h2>
            <p className="text-xs text-white/60">A compassionate non-clinical space to process sensory and work fatigue</p>
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="p-2 text-white/40 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          title="Clear chat history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* CHAT DISPLAY CONTAINER */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4">
        {messages.map((m) => {
          const isMe = m.role === "user";
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl p-4.5 shadow-md border ${
                isMe 
                  ? "bg-purple-500/15 border-purple-500/25 rounded-tr-none text-right" 
                  : "bg-white/5 border-white/10 rounded-tl-none text-left backdrop-blur-md"
              }`}>
                {/* ROLE INDICATOR OR CHAT AVATAR */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/50">
                    {isMe ? "YOU" : "SOLACE"}
                  </span>
                  {!isMe && <Heart className="w-3 h-3 text-blue-400 fill-current animate-pulse" />}
                </div>

                {/* CONTENT PARSED */}
                <div className="text-white/80 leading-relaxed">
                  {isMe ? (
                    <div className="space-y-1">
                      {m.content && m.content !== "Sent a voice entry." && (
                        <p className="text-xs sm:text-sm font-sans text-right">{m.content}</p>
                      )}
                      {m.audioUrl && (
                        <ChatAudioPlayer src={m.audioUrl} duration={m.audioDuration || 5} />
                      )}
                    </div>
                  ) : (
                    renderMessageContent(m.content)
                  )}
                </div>

                {/* TIME STAMP */}
                <span className="text-[9px] font-mono text-white/40 block mt-1.5">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 rounded-tl-none max-w-[50%] flex items-center gap-2">
              <span className="text-[11px] font-mono text-white/50 uppercase tracking-widest">Solace is cultivating quiet</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* PRESETS */}
      {messages.length === 1 && (
        <div className="mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-purple-300 mb-2 font-semibold">
            Suggested starting themes:
          </p>
          <div className="flex flex-wrap gap-2">
            {INITIAL_CONVO_PRESETS.map((preset) => (
              <button
                key={preset.text}
                onClick={() => handleSendMessage(preset.text)}
                className="text-left text-[11px] text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/15 py-2 px-3 rounded-xl transition-all flex items-center gap-1.5 font-medium cursor-pointer"
              >
                <span>{preset.text}</span>
                <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* COLLAPSIBLE RECORDER AREA */}
      {showVoiceInput && (
        <div className="mb-3 animate-fade-in bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-300 font-bold flex items-center gap-1">
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              Voice Recording Input Mode
            </span>
          </div>
          <div key={audioResetKey}>
            <AudioRecorder
              onAudioSave={(base64, duration) => {
                setAttachedAudioUrl(base64);
                setAttachedAudioDuration(duration);
              }}
              onAudioClear={() => {
                setAttachedAudioUrl(undefined);
                setAttachedAudioDuration(undefined);
              }}
            />
          </div>
        </div>
      )}

      {/* INPUT FORM CONTAINER */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input, attachedAudioUrl, attachedAudioDuration);
        }}
        className="flex items-center gap-2"
      >
        <button
          type="button"
          onClick={() => setShowVoiceInput(!showVoiceInput)}
          className={`p-3 rounded-xl transition-all shrink-0 border cursor-pointer ${
            showVoiceInput 
              ? "bg-purple-600/35 border-purple-500 text-white shadow-lg" 
              : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
          }`}
          title="Toggle Voice input"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={attachedAudioUrl ? "Voice note attached. Add text or send..." : "Share your anxiety or seek a breathing check..."}
          className="flex-1 text-sm bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-blue-400/50 focus:bg-white/10 transition-all rounded-xl p-3 focus:outline-none"
        />
        <button
          type="submit"
          disabled={(!input.trim() && !attachedAudioUrl) || isTyping}
          className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shrink-0 shadow-md disabled:opacity-40 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
