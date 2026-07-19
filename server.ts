import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazy-loaded to fail gracefully if API key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it via the Secrets panel in Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

/**
 * Converts raw 16-bit mono PCM audio data into a standard WAV format buffer.
 * Gemini TTS returns raw 16-bit mono PCM at 24000Hz.
 */
function pcmToWav(pcmBuffer: Buffer, sampleRate: number = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const subChunk2Size = pcmBuffer.length;
  const chunkSize = 36 + subChunk2Size;

  const header = Buffer.alloc(44);

  // RIFF Chunk
  header.write("RIFF", 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write("WAVE", 8);

  // fmt Sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);

  // data Sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(subChunk2Size, 40);

  return Buffer.concat([header, pcmBuffer]);
}

/**
 * Parses errors thrown by the @google/genai SDK to provide human-friendly,
 * actionable error messages for quota limit (429) or other API constraints.
 */
function parseGeminiError(error: any): string {
  if (!error) return "An unknown error occurred during audio or text generation.";
  
  const errorMessage = error.message || "";
  const errorStatus = error.status || "";
  const errorCode = error.code || "";
  const errorString = (errorMessage + " " + errorStatus + " " + errorCode + " " + String(error) + " " + JSON.stringify(error)).toLowerCase();

  // Rate Limit / Quota Exceeded Checks
  if (
    errorStatus === "RESOURCE_EXHAUSTED" ||
    errorCode === 429 ||
    errorString.includes("429") ||
    errorString.includes("quota exceeded") ||
    errorString.includes("resource_exhausted") ||
    errorString.includes("rate limit") ||
    errorString.includes("exceeded your current quota") ||
    errorString.includes("retry in")
  ) {
    if (errorString.includes("gemini-3.1-flash-tts")) {
      return "The free-tier daily request quota for the Gemini 3.1 TTS Preview engine has been reached (the limit is 10 requests per day per project). Please try again shortly or after a brief pause when your daily quota resets!";
    }
    return "The Gemini API request quota has been exceeded. Please wait a moment and try again shortly.";
  }

  return error.message || "Failed to process the request with the Gemini API.";
}

// ==================== API ENDPOINTS ====================

/**
 * Health Check
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/**
 * Endpoint to generate TTS voiceover using gemini-3.1-flash-tts-preview
 */
app.post("/api/voiceovers/generate", async (req, res) => {
  try {
    const { script, performanceNote, voiceName } = req.body;

    if (!script || typeof script !== "string" || script.trim() === "") {
      return res.status(400).json({ error: "Script text is required." });
    }

    const voice = voiceName || "Kore";
    const ai = getGeminiClient();

    // For gemini-3.1-flash-tts-preview, system/developer instructions are not supported in config.
    // We embed instructions and performance guidelines directly inside the prompt text part,
    // which the model interprets and executes natively.
    const promptText = `Style: ${performanceNote || "natural, conversational, engaging"}.
Instructions: Read the script exactly as written. Do not read these instructions or bracketed cues. Speak only the script below.

Script:
${script}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.[0];
    const rawBase64 = audioPart?.inlineData?.data;

    if (!rawBase64) {
      console.error("Gemini Response structure:", JSON.stringify(response, null, 2));
      throw new Error("No audio data returned from the Gemini Text-to-Speech API. This can sometimes happen if the script is unsupported or flagged.");
    }

    // Convert raw 24kHz PCM to standard playable WAV format
    const pcmBuffer = Buffer.from(rawBase64, "base64");
    const wavBuffer = pcmToWav(pcmBuffer, 24000);
    const wavBase64 = wavBuffer.toString("base64");

    res.json({
      success: true,
      audio: `data:audio/wav;base64,${wavBase64}`,
      durationEst: Math.round((pcmBuffer.length / 2) / 24000), // Estimated duration in seconds (16-bit = 2 bytes/sample)
      metadata: {
        voice,
        performanceNote,
        scriptLength: script.length,
      }
    });
  } catch (error: any) {
    console.error("Voiceover Generation Error:", error);
    res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});

/**
 * Endpoint to optimize scripts using gemini-3.5-flash
 */
app.post("/api/scripts/optimize", async (req, res) => {
  try {
    const { script, style, targetPlatform } = req.body;

    if (!script || typeof script !== "string" || script.trim() === "") {
      return res.status(400).json({ error: "Script text is required." });
    }

    const ai = getGeminiClient();

    const prompt = `You are a viral content consultant specializing in YouTube Shorts and Instagram Reels.
Take the following raw script and optimize it to make it highly engaging, punchy, and retention-friendly.

Optimization Guidelines:
1. MUST grab attention in the first 2 seconds (add an ultra-engaging hook if missing).
2. Write for natural spoken delivery (keep sentences relatively short and fluid).
3. If the desired style is 'Hinglish', naturally convert suitable parts to conversational Hindi-English mix (Hinglish) while keeping critical technical/English terms in English.
4. Maintain the core message and meaning of the original script.
5. Do NOT add bracketed descriptions, sounds, visual directions, or emojis. Output ONLY the optimized spoken text script that will be read by a TTS voice.

Style selected: ${style || "Engaging & Modern"}
Target Platform: ${targetPlatform || "Reels/Shorts"}

Raw Script:
${script}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const optimizedScript = response.text?.trim() || "";

    res.json({
      success: true,
      optimizedScript,
    });
  } catch (error: any) {
    console.error("Script Optimization Error:", error);
    res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});

/**
 * Endpoint to generate a complete script from an idea/topic using gemini-3.5-flash
 */
app.post("/api/scripts/generate", async (req, res) => {
  try {
    const { topic, duration, tone, language } = req.body;

    if (!topic || typeof topic !== "string" || topic.trim() === "") {
      return res.status(400).json({ error: "Topic/Idea is required." });
    }

    const ai = getGeminiClient();

    const prompt = `You are a professional content writer for Instagram Reels and YouTube Shorts.
Generate a highly engaging, viral video script based on this topic: "${topic}".

Details:
- Approximate Spoken Duration: ${duration || "30 seconds"}
- Tone: ${tone || "energetic"}
- Language: ${language || "Hinglish"}

Rules for the generated script:
1. Ensure there is a powerful hook in the first 3 seconds.
2. Structure the body with high-pace, value-packed points to maximize viewer retention.
3. End with a strong, natural Call to Action (CTA) or a clever looping transition.
4. If the language is 'Hinglish', write the script in conversational Latin/English script with a natural mix of Hindi and English words.
5. Output ONLY the raw spoken text. DO NOT write stage directions, characters, section headers (like "Hook:", "Body:"), emojis, sound effects, or descriptions. Just output the clean speech.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const script = response.text?.trim() || "";

    res.json({
      success: true,
      script,
    });
  } catch (error: any) {
    console.error("Script Generation Error:", error);
    res.status(500).json({
      error: parseGeminiError(error),
    });
  }
});

// ==================== VITE & STATIC SERVING ====================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
