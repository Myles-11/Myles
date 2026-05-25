import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini Client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FOR_LINTING_OR_DEV",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Check API Key endpoint
app.get("/api/wellbeing/status", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
  res.json({
    status: "ok",
    hasApiKey: hasKey,
    message: hasKey 
      ? "AI services are fully active." 
      : "Gemini API key is not configured. Falling back to local/static responses until configured in Secrets.",
  });
});

// 1. Organize Task Brain-dump into structured, mindful day schedule
app.post("/api/wellbeing/organize", async (req, res) => {
  const { brainDump } = req.body;
  if (!brainDump || typeof brainDump !== "string" || brainDump.trim() === "") {
    return res.status(400).json({ error: "A brain dump string is required." });
  }

  // Graceful fallback if no Gemini key
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    return res.json({
      tasks: [
        {
          id: "task-1",
          title: "Organize environment",
          type: "maintenance",
          durationMin: 15,
          timeSlot: "09:00 - 09:15",
          description: "Clear your desk. A tidy space reduces sensory noise.",
          stressImpact: "low",
          mindfulnessTip: "Feel the texture of the objects you clean as a grounding exercise."
        },
        {
          id: "task-2",
          title: "Address high priority task",
          type: "focus",
          durationMin: 45,
          timeSlot: "09:15 - 10:00",
          description: "Focus purely on one item from your brain dump.",
          stressImpact: "high",
          mindfulnessTip: "Turn off notifications. Focus on doing just one thing first."
        },
        {
          id: "task-3",
          title: "Pranayama deep breathing break",
          type: "break",
          durationMin: 10,
          timeSlot: "10:00 - 10:10",
          description: "A short release to calm the nervous system.",
          stressImpact: "low",
          mindfulnessTip: "Use the animated breathing guide for deep breaths."
        },
        {
          id: "task-4",
          title: "Follow-up responsibilities",
          type: "focus",
          durationMin: 40,
          timeSlot: "10:10 - 10:50",
          description: "Take care of low-stress administrative work or items.",
          stressImpact: "medium",
          mindfulnessTip: "Practice gentle posture corrections as you sit."
        },
        {
          id: "task-5",
          title: "Mindful walk or water replenishment",
          type: "break",
          durationMin: 15,
          timeSlot: "10:50 - 11:05",
          description: "Stretch your legs, hydrate, and look away from all screens.",
          stressImpact: "low",
          mindfulnessTip: "Drink your water slowly, noting its cool temperature."
        }
      ],
      fallback: true
    });
  }

  try {
    const ai = getGeminiClient();
    const systemInstruction = 
      "You are a compassionate workspace organizer, master executive-function assistant, and mental health counselor. " +
      "Your objective is to translate a chaotic of-the-moment brain-dump of chores, thoughts, anxiety, and work into a human-friendly, " +
      "beautifully structured, bite-sized daily schedule with focus blocks and soothing breaks. " +
      "Ensure intense 'focus' blocks represent maximum 45-minute stretches, and alternate them with restorative 'break' blocks (5-15 mins) " +
      "to lower cortisol. Assign a compassionate, non-judgmental description and a gentle mindfulness tip for each segment.";

    const prompt = `Here is my raw task dump or current state of mind: "${brainDump}". Please organize this into a beautifully ordered day schedule.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              description: "The list of organized schedule slots/tasks.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "A unique string id e.g. task-1, task-2" },
                  title: { type: Type.STRING, description: "Clear, concise direct title of the block e.g. Write report proposal, Mindful tea stretch" },
                  type: { 
                    type: Type.STRING, 
                    description: "Category of the task. Must be focus, break, or maintenance" 
                  },
                  durationMin: { type: Type.INTEGER, description: "Duration in minutes" },
                  timeSlot: { type: Type.STRING, description: "A suggested time slot like '09:00 - 09:45'" },
                  description: { type: Type.STRING, description: "Practical, friendly explanation of what to do." },
                  stressImpact: { 
                    type: Type.STRING, 
                    description: "Predicted stress or cognitive load. One of: low, medium, high" 
                  },
                  mindfulnessTip: { type: Type.STRING, description: "A simple micro-mindfulness cue customized for this task to stay centered." }
                },
                required: ["id", "title", "type", "durationMin", "timeSlot", "description", "stressImpact", "mindfulnessTip"]
              }
            }
          },
          required: ["tasks"]
        }
      }
    });

    const bodyText = response.text;
    if (!bodyText) {
      throw new Error("No text response from Gemini.");
    }
    const resultJson = JSON.parse(bodyText);
    res.json(resultJson);
  } catch (error: any) {
    console.error("Gemini Task Reorganization Error:", error);
    res.status(500).json({ error: "Failed to re-organize tasks. Please try again or check your API key." });
  }
});

// 2. Cognitive CBT Cognitive Reframe
app.post("/api/wellbeing/reframe", async (req, res) => {
  const { worry } = req.body;
  if (!worry || typeof worry !== "string" || worry.trim() === "") {
    return res.status(400).json({ error: "Worry string is required." });
  }

  // Fallback
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    return res.json({
      worry: worry,
      cognitiveDistortion: "Catastrophizing / Overgeneralization",
      empatheticValidation: "It makes complete sense why you feel overwhelmed. Carrying that degree of pressure is exhausting.",
      healthyReframe: "While I want to perform well, one busy day does not define my personal worth. My effort is valuable, and I can move through this one small piece at a time.",
      microAction: "Open the main document, write down just the first sentence or section header, and then close it for a 2-minute tea break.",
      breathingDurationSec: 120,
      fallback: true
    });
  }

  try {
    const ai = getGeminiClient();
    const systemInstruction = 
      "You are an empathetic licensed psychologist specializing in Cognitive Behavioral Therapy (CBT). " +
      "When a user shares a stressful, automatic cognitive thought or worry, analyze it. " +
      "Identify the sub-cognitive distortion present (e.g. Catastrophizing, All-or-Nothing, Mind Reading, Emotional Reasoning, Should Statements). " +
      "Then offer a soothing, validating comment. Next, construct a highly balanced, realistic cognitive reframe. " +
      "Finally, suggest an absolute minimum, zero-intimidation micro-action to build momentum, and specify a suggested breathing time in seconds.";

    const prompt = `My automatic thought is: "${worry}". Help me examine and reframe this.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            worry: { type: Type.STRING },
            cognitiveDistortion: { type: Type.STRING, description: "The cognitive trap identified (e.g. Catastrophizing)" },
            empatheticValidation: { type: Type.STRING, description: "Short warm message reassuring the user their emotion is safe & understood." },
            healthyReframe: { type: Type.STRING, description: "A balanced, compassionate, realistic CBT alternative thought." },
            microAction: { type: Type.STRING, description: "A tiny, doable 2-minute step to break through cognitive friction." },
            breathingDurationSec: { type: Type.INTEGER, description: "Suggested breathing guide duration in seconds, e.g. 60, 120, 180" }
          },
          required: ["worry", "cognitiveDistortion", "empatheticValidation", "healthyReframe", "microAction", "breathingDurationSec"]
        }
      }
    });

    const bodyText = response.text;
    if (!bodyText) {
      throw new Error("No response from Gemini.");
    }
    const resultJson = JSON.parse(bodyText);
    res.json(resultJson);
  } catch (error: any) {
    console.error("Gemini Reframe Error:", error);
    res.status(500).json({ error: "Failed to reframe thought. Please try again." });
  }
});

// 3. Conversational AI Companion (Chat)
app.post("/api/wellbeing/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  // Fallback
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
    const lastMsg = messages[messages.length - 1];
    const hasAudio = lastMsg && lastMsg.audioUrl;
    return res.json({
      text: hasAudio
        ? "I have safely received your peaceful voice memo. Even though my premium direct Gemini API listener is currently in sandbox mode, listening to your voice confirms how much depth you are carrying today. Take a slow, deep breath, and let it all go. What is on your mind?"
        : "I am here with you. (Gemini key offline, demonstrating conversational fallback): Remember to breathe. It is entirely okay to feel tired, anxious, or unfocused right now. Let's practice taking a single conscious breath together. Is there a small thing on your mind you want to tackle or let go of today?",
      fallback: true
    });
  }

  try {
    const ai = getGeminiClient();
    
    // Map messages payload to Gemini API content format supporting voice audio clips
    const contents = messages.map((m) => {
      const parts: any[] = [];
      
      if (m.content) {
        parts.push({ text: m.content });
      }
      
      if (m.audioUrl) {
        const matches = m.audioUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        }
      }

      // Safeguard part element presence
      if (parts.length === 0) {
        parts.push({ text: "" });
      }

      return {
        role: m.role === "assistant" ? "model" : "user",
        parts: parts,
      };
    });

    const systemInstruction = 
      "You are 'Solace', an incredibly warm, emotionally intelligent, and grounding AI Well-being Companion. " +
      "You gently listen, validate feelings naturally and with deep empathy, apply CBT principles to comfort stress, " +
      "advocate for realistic pace and mini-breaks, and act as a safe, soothing space. " +
      "You can accept both text input and voice audio files of the user speaking. If the user records and sends an audio message, " +
      "absorb their spoken words, recognize if their voice feels tired or tense, and reply with extra warmth and calming cadence. " +
      "Keep responses relatively short (1-3 beautifully phrased paragraphs), formatting with linebreaks and calm bullet lists for highly readable aesthetics. " +
      "Never sound clinical, repetitive, or robotic. Refrain from claiming medical status, simply be an empathetic partner.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.8,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    res.send({ text: "I'm right here. However, my connection to the AI gateway is temporarily busy. Let's take a peaceful moment to focus on our breath together: Inhale slowly for 4 seconds... hold... exhale..." });
  }
});

// Setup Vite Dev server or Serve Static production files
async function startApp() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static production assets configured.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Fullstack Express + Vite App starting on http://localhost:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error("Failed to start Fullstack server:", err);
});
