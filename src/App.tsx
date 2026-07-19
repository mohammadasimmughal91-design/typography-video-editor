import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  Mic, 
  Volume2, 
  Check, 
  HelpCircle, 
  ArrowRight,
  Info,
  Clock,
  Music,
  Share2,
  ListRestart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceoverHistoryItem, PrebuiltVoice, SampleTemplate } from './types';

// Voice metadata for Gemini TTS
const PREBUILT_VOICES: PrebuiltVoice[] = [
  {
    name: 'Kore',
    gender: 'Female',
    description: 'Bright, clear, and professional female voice with great rhythm.',
    tags: ['Tech Reviews', 'Tutorials', 'Explainers', 'Professional']
  },
  {
    name: 'Charon',
    gender: 'Male',
    description: 'Deep, warm, and highly cinematic male voice with a calm, narrator pace.',
    tags: ['Documentary', 'Storytelling', 'Quotes', 'Calm & Deep']
  },
  {
    name: 'Puck',
    gender: 'Male',
    description: 'Bold, energetic, and punchy male voice that instantly grabs attention.',
    tags: ['Viral Reels', 'Product Promos', 'Ad Scripts', 'High Energy']
  },
  {
    name: 'Zephyr',
    gender: 'Female',
    description: 'Soft, friendly, and deeply emotional female voice with warm pacing.',
    tags: ['Lifestyle', 'Cooking/Food', 'Travel Vlogs', 'Warm & Cozy']
  },
  {
    name: 'Fenrir',
    gender: 'Male',
    description: 'Balanced, natural, and standard male voice suitable for everyday logs.',
    tags: ['Daily Vlogs', 'News Digests', 'Casual Chats', 'Natural']
  },
  {
    name: 'Sulafat',
    gender: 'Female',
    description: 'Deep, warm, friendly, and calm female voice with steady low pace.',
    tags: ['Calm & Warm', 'Podcasts', 'Narratives', 'Friendly']
  }
];

// Sample templates for content creators to test Hinglish and other languages
const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'hinglish-tech',
    title: '📱 Budget Laptop (Hinglish)',
    language: 'Hinglish',
    description: 'High-energy tech review in natural Hindi-English mix code-switching.',
    script: 'Dosto, agar aap bhi video editing ke liye budget laptop dhoond rahe hain, toh yeh video end tak dekhna! Aaj main aapko bataunga ek aisa killer option jo 4K edit aasaani se handle kar sakta hai. Asus Vivobook with Ryzen 5 processor. Speed iski kamaal ki hai aur rendering mein toh bilkul lag nahi karta. Follow karna mat bhoolna for more daily tech hacks!',
    suggestedVoice: 'Puck',
    suggestedPerformance: 'Fast, enthusiastic, high energy with punchy transitions'
  },
  {
    id: 'hinglish-finance',
    title: '💰 Inflation Trap (Hinglish)',
    language: 'Hinglish',
    description: 'Educational finance advisor mixing conversational Hindi & English finance terms.',
    script: 'Kya aapko pata hai ki aam log saving ke naam par apna nuksaan kar rahe hain? Inflation har saal 6% badh raha hai aur bank FD sirf 4-5% interest deti hai. Iska matlab aapka paisa actually grow nahi, balki decrease ho raha hai! wealth build karni hai toh mutual funds ya stocks mein smart investment seekho. Screen par double-tap karke save karlo is reel ko!',
    suggestedVoice: 'Kore',
    suggestedPerformance: 'Professional, articulate, warm and trustworthy narrator'
  },
  {
    id: 'english-viral',
    title: '🔥 ChatGPT Email Hacks (English)',
    language: 'English',
    description: 'Classic high-energy viral hook and value points sequence.',
    script: 'Stop scrolling! If you are still using regular ChatGPT to write your emails, you are doing it completely wrong. Here are three game-changing prompts that will save you five hours a week. First, the "Persona Prompt" – copy this down: "Act as an executive copywriter with ten years of tech experience..." Double tap if this was helpful!',
    suggestedVoice: 'Puck',
    suggestedPerformance: 'Upbeat, high impact, rapid pacing, enthusiastic'
  },
  {
    id: 'hindi-motivational',
    title: '✨ Jeet ka Hausla (Hindi)',
    language: 'Hindi',
    description: 'Deep, emotional motivational narration in standard Devnagri/Hindi text.',
    script: 'Zindagi mein agar kuch bada hasil karna hai, toh sabse pehle apne darr ka samna karna seekho. Kyunki jo darr gaya, samajh lo woh ruk gaya. Mehnat har roz karni padegi, chahe man ho ya na ho. Aaj hi apna pehla step uthao aur kal ka intezar mat karo. Apne hausle ko itna bada banao ki musibat bhi choti lagne lage.',
    suggestedVoice: 'Charon',
    suggestedPerformance: 'Deep cinematic narrator, slow pacing, inspiring and emotional'
  },
  {
    id: 'lifestyle-vlog',
    title: '🌿 Slow Sunday Routine (English)',
    language: 'English',
    description: 'Soft lifestyle, cooking, or aesthetic diary narration.',
    script: 'Slow Sundays are my absolute favorite. Starting the day with a hot cup of matcha, watering my plants, and spending a few minutes reading by the window. There is something so healing about not rushing. Tell me in the comments: what is your favorite Sunday ritual?',
    suggestedVoice: 'Zephyr',
    suggestedPerformance: 'Whispered, very calm, slow, cozy and intimate'
  }
];

// Quick performance presets to help creators define tone easily
const PERFORMANCE_PRESETS = [
  "Slow, dramatic, deep documentary narrator",
  "High energy, rapid pacing, excited viral reel hook",
  "Aesthetic vlog, soft, calm, cozy & whispered",
  "Professional, articulate & warm corporate narrator",
  "Conversational, casual, friendly daily vlogger"
];

// Reassuring messages during audio generation
const LOADING_MESSAGES = [
  "Connecting to Gemini TTS engine...",
  "Parsing script phrasing and Hinglish code-switches...",
  "Applying style performance directions...",
  "Generating high-fidelity 24kHz audio signals...",
  "Wrapping sound structures with pristine WAV header...",
  "Finalizing audio file download package..."
];

interface VoiceStylePreset {
  name: string;
  voiceName: string;
  performanceNote: string;
  description: string;
}

const VOICE_STYLE_PRESETS: VoiceStylePreset[] = [
  {
    name: "Deep & Calm",
    voiceName: "Sulafat",
    performanceNote: "Deep, warm, friendly, and calm — steady low pace, reassuring tone, like a trusted friend giving advice late at night.",
    description: "Sulafat • Midnight Friend"
  },
  {
    name: "Viral Hook",
    voiceName: "Puck",
    performanceNote: "Extremely energetic, rapid-fire pacing, high excitement level with crisp word delivery.",
    description: "Puck • High Energy"
  },
  {
    name: "Cinematic Story",
    voiceName: "Charon",
    performanceNote: "Dramatic, slow, deep cinematic narration style, full of tension and emotional weight.",
    description: "Charon • Documentary"
  },
  {
    name: "Friendly Vlogger",
    voiceName: "Zephyr",
    performanceNote: "Upbeat, casual, cozy everyday vlogger style — bubbly, highly relatable, and natural.",
    description: "Zephyr • Lifestyle Vlog"
  },
  {
    name: "Tech Educator",
    voiceName: "Kore",
    performanceNote: "Professional, articulate, highly informative, perfectly balanced pacing for easy comprehension.",
    description: "Kore • Informative Coach"
  },
  {
    name: "Shelby — Calm Command",
    voiceName: "Orus",
    performanceNote: "A calm, controlled Birmingham English accent. Speaks low and deliberately slow, never raising volume even when the words are sharp. Long, weighted pauses between phrases — the kind of quiet that makes people lean in. No wasted words, no rushing. Sounds completely certain of every sentence, faintly threatening without ever sounding angry.",
    description: "Orus • Calm Command"
  },
  {
    name: "Tommy",
    voiceName: "Orus",
    performanceNote: "Shaant aur poore control mein bolo — Birmingham gangster jaisa attitude, lekin awaaz kabhi tez nahi hoti. Har line slow aur weighted, jaise har word soch samajh kar bola ja raha ho. Beech mein lambe pauses — wahi khamoshi jo saamne wale ko dhyan se sunne pe majboor kar de. Ek bhi word waste nahi, koi jaldi nahi. Poori tarah confident lage, halka sa threatening bhi lage bina gussa dikhaye.",
    description: "Orus • Tommy"
  },
  {
    name: "Bunty — Reel King",
    voiceName: "Fenrir",
    performanceNote: "Punchy aur crisp energy ke saath bolo — fast-paced, hype wali awaaz jo reels ke liye bani ho. Har line confident aur sharp, jaise attention turant grab karna ho. Words clearly punch karo, drag mat karo. Excited aur upbeat lage, jaise koi bada reveal ya hook line bol raha ho.",
    description: "Fenrir • Reel King"
  }
];

class SpeechSynthAudio {
  private utterance: SpeechSynthesisUtterance;
  private timer: any = null;
  public currentTime: number = 0;
  public duration: number = 10;
  private listeners: { [key: string]: Function[] } = {};
  private isPaused: boolean = true;

  constructor(text: string, voiceName: string, durationEst: number) {
    this.utterance = new SpeechSynthesisUtterance(text);
    this.duration = durationEst || 10;

    // Load available voices
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const getBestVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Match name first
        let match = voices.find(v => v.name.toLowerCase().includes(voiceName.toLowerCase()));
        
        if (!match) {
          // If Hinglish/Hindi or script looks non-english, prefer hi-IN voice if available
          const hasHindi = /[\u0900-\u097F]/.test(text) || text.toLowerCase().includes('dosto') || text.toLowerCase().includes('hai');
          if (hasHindi) {
            match = voices.find(v => v.lang.startsWith('hi'));
          }
        }
        
        if (!match) {
          // Search for English standard
          match = voices.find(v => v.lang.startsWith('en'));
        }
        
        return match || voices[0];
      };

      const setVoice = () => {
        const bestVoice = getBestVoice();
        if (bestVoice) {
          this.utterance.voice = bestVoice;
        }
      };

      setVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = setVoice;
      }
    }

    this.utterance.onend = () => {
      this.currentTime = this.duration;
      this.dispatchEvent('timeupdate');
      this.dispatchEvent('ended');
      this.stopTimer();
    };

    this.utterance.onerror = () => {
      this.dispatchEvent('ended');
      this.stopTimer();
    };
  }

  addEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    
    // Trigger loadedmetadata after a short delay
    if (event === 'loadedmetadata') {
      setTimeout(() => this.dispatchEvent('loadedmetadata'), 50);
    }
  }

  removeEventListener(event: string, callback: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  private dispatchEvent(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb());
    }
  }

  play(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      this.isPaused = false;
      
      // Speak the utterance
      window.speechSynthesis.speak(this.utterance);

      this.dispatchEvent('play');
      this.startTimer();
      resolve();
    });
  }

  pause() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
    this.isPaused = true;
    this.dispatchEvent('pause');
    this.stopTimer();
  }

  private startTimer() {
    this.stopTimer();
    const interval = 100; // Update every 100ms
    this.timer = setInterval(() => {
      this.currentTime += interval / 1000;
      if (this.currentTime >= this.duration) {
        this.currentTime = this.duration;
        this.dispatchEvent('timeupdate');
        this.dispatchEvent('ended');
        this.stopTimer();
      } else {
        this.dispatchEvent('timeupdate');
      }
    }, interval);
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export default function App() {
  const [script, setScript] = useState<string>('');
  const [performanceNote, setPerformanceNote] = useState<string>('');
  const [voiceName, setVoiceName] = useState<string>('Kore');
  const [history, setHistory] = useState<VoiceoverHistoryItem[]>([]);
  
  // Tabs & loading states
  const [activeTab, setActiveTab] = useState<'write' | 'generate'>('write');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [isWritingScript, setIsWritingScript] = useState<boolean>(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [hasQuotaError, setHasQuotaError] = useState<boolean>(false);
  
  // AI Script Generator Form state
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiDuration, setAiDuration] = useState<string>('30 seconds');
  const [aiTone, setAiTone] = useState<string>('energetic and viral');
  const [aiLanguage, setAiLanguage] = useState<string>('Hinglish');

  // Currently loaded audio player state
  const [activeAudioItem, setActiveAudioItem] = useState<VoiceoverHistoryItem | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [audioProgress, setAudioProgress] = useState<number>(0);

  // Audio elements & animation refs
  const audioRef = useRef<any | null>(null);
  const [barHeights, setBarHeights] = useState<number[]>(Array(24).fill(15));

  // Load history from localStorage on startup
  useEffect(() => {
    try {
      const stored = localStorage.getItem('voiceover_generator_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(parsed);
        if (parsed.length > 0) {
          setActiveAudioItem(parsed[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }

    // Set first sample script to give a nice visual starting point
    setScript(SAMPLE_TEMPLATES[0].script);
    setVoiceName(SAMPLE_TEMPLATES[0].suggestedVoice);
    setPerformanceNote(SAMPLE_TEMPLATES[0].suggestedPerformance);
  }, []);

  // Sync history state to localStorage with self-healing storage fallback
  const saveHistory = (newHistory: VoiceoverHistoryItem[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem('voiceover_generator_history', JSON.stringify(newHistory));
    } catch (e) {
      console.warn("Storage quota exceeded, pruning old audio files to save storage space...", e);
      // Attempt 1: Keep only the most recent 3 items with actual audio, clear older audio
      try {
        const pruned3 = newHistory.map((item, index) => 
          index < 3 ? item : { ...item, audioUrl: '' }
        );
        localStorage.setItem('voiceover_generator_history', JSON.stringify(pruned3));
      } catch (e1) {
        // Attempt 2: Keep only the most recent 1 item with actual audio, clear older audio
        try {
          const pruned1 = newHistory.map((item, index) => 
            index < 1 ? item : { ...item, audioUrl: '' }
          );
          localStorage.setItem('voiceover_generator_history', JSON.stringify(pruned1));
        } catch (e2) {
          // Attempt 3: Keep only metadata, clear all audio
          try {
            const prunedMetadataOnly = newHistory.map(item => ({ ...item, audioUrl: '' }));
            localStorage.setItem('voiceover_generator_history', JSON.stringify(prunedMetadataOnly));
          } catch (e3) {
            // Attempt 4: Keep only the 5 most recent metadata-only items
            try {
              const prunedMinimal = newHistory.slice(0, 5).map(item => ({ ...item, audioUrl: '' }));
              localStorage.setItem('voiceover_generator_history', JSON.stringify(prunedMinimal));
            } catch (e4) {
              console.error("Critical: Could not save even minimal history to localStorage", e4);
            }
          }
        }
      }
    }
  };

  // Cycling loading messages during TTS generation
  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setLoadingMsgIdx(0);
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Audio wave visualizer animation
  useEffect(() => {
    let animationFrameId: number;
    
    const updateVisualizer = () => {
      if (isPlaying) {
        setBarHeights(Array.from({ length: 24 }, () => Math.floor(Math.random() * 60) + 10));
        animationFrameId = requestAnimationFrame(updateVisualizer);
      } else {
        setBarHeights(Array(24).fill(15));
      }
    };

    if (isPlaying) {
      updateVisualizer();
    } else {
      setBarHeights(Array(24).fill(15));
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying]);

  // Manage native HTMLAudioElement or local browser SpeechSynthAudio
  useEffect(() => {
    if (activeAudioItem) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (!activeAudioItem.audioUrl) {
        audioRef.current = null;
        setIsPlaying(false);
        setAudioProgress(0);
        return;
      }
      
      let audio: any;
      if (activeAudioItem.audioUrl.startsWith('speechsynth://')) {
        const text = decodeURIComponent(activeAudioItem.audioUrl.replace('speechsynth://', ''));
        audio = new SpeechSynthAudio(text, activeAudioItem.voiceName, activeAudioItem.durationEst || estimateSeconds(script));
      } else {
        audio = new Audio(activeAudioItem.audioUrl);
      }
      audioRef.current = audio;

      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudioProgress(0);
      });
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration || activeAudioItem.durationEst || 0);
      });
      audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
          setAudioProgress((audio.currentTime / audio.duration) * 100);
        }
      });

      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [activeAudioItem]);

  // Toggle Play/Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed", err);
        setError("Playback failed. Please interact with the app page first.");
      });
    }
  };

  // Seek Audio Progress
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !audioDuration) return;
    const seekPct = parseFloat(e.target.value);
    const newTime = (seekPct / 100) * audioDuration;
    audioRef.current.currentTime = newTime;
    setAudioProgress(seekPct);
  };

  // Load a template
  const handleSelectTemplate = (template: SampleTemplate) => {
    setScript(template.script);
    setVoiceName(template.suggestedVoice);
    setPerformanceNote(template.suggestedPerformance);
    setError(null);
    
    // Jump user to editor
    setActiveTab('write');
  };

  // Estimate duration based on word count (approx 140 words per minute)
  const getWordCount = (txt: string) => txt.trim() === '' ? 0 : txt.trim().split(/\s+/).length;
  const estimateSeconds = (txt: string) => {
    const wordCount = getWordCount(txt);
    if (wordCount === 0) return 0;
    return Math.max(1, Math.round((wordCount / 140) * 60));
  };

  // Call API to generate voiceover audio
  const handleGenerateVoiceover = async () => {
    if (!script.trim()) {
      setError("Please write or paste a script first.");
      return;
    }
    
    setError(null);
    setHasQuotaError(false);
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/voiceovers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          performanceNote,
          voiceName
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server returned an error generating speech.');
      }

      const newItem: VoiceoverHistoryItem = {
        id: `vo-${Date.now()}`,
        script,
        voiceName,
        performanceNote,
        audioUrl: data.audio,
        durationEst: data.durationEst || estimateSeconds(script),
        timestamp: Date.now()
      };

      const updatedHistory = [newItem, ...history];
      saveHistory(updatedHistory);
      setActiveAudioItem(newItem);
      
      // Auto-play the newly generated audio
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));
        }
      }, 200);

    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || "";
      setError(errMsg || "Failed to contact voiceover service. Please try again.");
      
      const isQuotaOrServerErr = errMsg.toLowerCase().includes('quota') || 
                                 errMsg.toLowerCase().includes('resource_exhausted') || 
                                 errMsg.toLowerCase().includes('rate limit') || 
                                 errMsg.toLowerCase().includes('limit') ||
                                 errMsg.toLowerCase().includes('internal') ||
                                 errMsg.toLowerCase().includes('500') ||
                                 errMsg.toLowerCase().includes('exhausted');
      if (isQuotaOrServerErr) {
        setHasQuotaError(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Offline Browser Voice Synthesis Fallback Method (no quotas, runs locally)
  const handleGenerateVoiceoverLocally = () => {
    if (!script.trim()) {
      setError("Please write or paste a script first.");
      return;
    }

    setError(null);
    setIsGenerating(true);

    setTimeout(() => {
      try {
        const newItem: VoiceoverHistoryItem = {
          id: `vo-local-${Date.now()}`,
          script,
          voiceName: voiceName + " (Local)",
          performanceNote: "Offline browser speech synthesis: " + (performanceNote || "natural"),
          audioUrl: `speechsynth://${encodeURIComponent(script)}`,
          durationEst: estimateSeconds(script),
          timestamp: Date.now()
        };

        const updatedHistory = [newItem, ...history];
        saveHistory(updatedHistory);
        setActiveAudioItem(newItem);

        // Auto-play the newly generated audio
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          }
        }, 200);
      } catch (err: any) {
        setError("Local synthesis failed: " + err.message);
      } finally {
        setIsGenerating(false);
      }
    }, 1200); // Friendly short delay representing offline building
  };

  // Call API to optimize the active script
  const handleOptimizeScript = async () => {
    if (!script.trim()) {
      setError("Add a script first before trying to optimize it.");
      return;
    }

    setError(null);
    setIsOptimizing(true);

    try {
      const response = await fetch('/api/scripts/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script,
          style: "Short-form hook optimized",
          targetPlatform: "YouTube Shorts / Instagram Reels"
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error optimizing script.');
      }

      setScript(data.optimizedScript);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not optimize script.");
    } finally {
      setIsOptimizing(false);
    }
  };

  // Call API to generate a complete script from prompt parameters
  const handleGenerateAIs_Script = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      setError("Please describe your video topic/idea first.");
      return;
    }

    setError(null);
    setIsWritingScript(true);

    try {
      const response = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          duration: aiDuration,
          tone: aiTone,
          language: aiLanguage
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error creating script.');
      }

      setScript(data.script);
      
      // Select appropriate voice suggestions based on tone/language
      if (aiLanguage === 'Hinglish') {
        setVoiceName('Puck'); // Puck is awesome for high-energy Hinglish
        setPerformanceNote('Fast energetic pacing, enthusiastic conversational hook');
      } else if (aiTone.includes('calm') || aiTone.includes('story')) {
        setVoiceName('Charon');
        setPerformanceNote('Slow, deep, atmospheric narrative');
      }

      // Automatically flip tab back to Editor to show the generated text
      setActiveTab('write');
      setAiTopic('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Could not generate script.");
    } finally {
      setIsWritingScript(false);
    }
  };

  // Delete a history item
  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
    if (activeAudioItem?.id === id) {
      if (updated.length > 0) {
        setActiveAudioItem(updated[0]);
      } else {
        setActiveAudioItem(null);
        setIsPlaying(false);
      }
    }
  };

  // Load and play previous item
  const handleSelectHistoryItem = (item: VoiceoverHistoryItem) => {
    setActiveAudioItem(item);
    setError(null);
    if (!item.audioUrl) {
      setError("This audio track has expired from browser persistence to save storage space. Write a script to generate a new voiceover.");
      setIsPlaying(false);
      return;
    }
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }, 100);
  };

  // Helper to format timestamp
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Helper to download WAV files safely
  const triggerDownload = (item: VoiceoverHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.audioUrl) {
      setError("This audio track is no longer available in browser persistence.");
      return;
    }
    if (item.audioUrl.startsWith('speechsynth://')) {
      setError("Downloading local browser syntheses is not supported. Only high-fidelity Gemini API tracks can be exported as WAV.");
      return;
    }
    const link = document.createElement("a");
    link.href = item.audioUrl;
    // Friendly file name representing script and voice
    const safeTitle = item.script.slice(0, 20).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `voiceover_${item.voiceName}_${safeTitle}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick word counts/limit meters
  const activeWordCount = getWordCount(script);
  const activeEstSeconds = estimateSeconds(script);
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Brand Navbar from Sleek Interface */}
      <nav className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-8 shrink-0 relative z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-sm"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Vocalist.ai</span>
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded uppercase tracking-wider">Pro</span>
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex space-x-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span className="text-indigo-600 font-bold border-b-2 border-indigo-600 pb-5">Studio Editor</span>
            <span className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">Voices</span>
            <span className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">History</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-inner">
            U
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-8 md:py-10 flex-1 flex flex-col relative z-10">
        
        {/* App Title Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-indigo-50 border border-indigo-100/80 rounded-full text-[11px] font-medium text-indigo-700 mb-2.5">
                <Mic className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                <span>Gemini 3.1 TTS Engine Online</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-slate-950">
                Voiceover Creator Studio
              </h1>
              <p className="mt-1.5 text-xs md:text-sm text-slate-500 max-w-2xl">
                The high-fidelity voice track workspace for short-form creators. Generate natural spoken tracks for Instagram Reels and YouTube Shorts in conversational <strong className="text-indigo-600 font-semibold">Hinglish</strong>, standard Hindi, English, and other styles.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 text-[11px]">
              <div className="px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                <span className="text-slate-400 block text-[10px]">Active Engine</span>
                <span className="font-mono text-slate-700 font-semibold">gemini-3.1-flash-tts-preview</span>
              </div>
              <div className="px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                <span className="text-slate-400 block text-[10px]">WAV Container</span>
                <span className="font-mono text-slate-700 font-semibold">24kHz wrapped stereo</span>
              </div>
            </div>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-200/80 text-red-850 rounded-2xl flex flex-col gap-3 text-sm shadow-sm"
            id="error-banner"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block text-red-900">
                  {error.toLowerCase().includes('quota') || error.toLowerCase().includes('limit') || error.toLowerCase().includes('exhausted')
                    ? "Gemini API Quota Exhausted"
                    : error.toLowerCase().includes('500') || error.toLowerCase().includes('internal')
                      ? "Gemini API Service Error"
                      : "Action Required"
                  }
                </span>
                <p>{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 font-bold text-xs underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            {hasQuotaError && (
              <div className="mt-1 p-3.5 bg-white border border-red-200/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5 text-xs text-slate-600">
                  <span className="font-bold text-slate-800 block">Seamless Local Fallback Available</span>
                  <p>You can generate this exact voiceover using your browser's offline high-fidelity speech synthesizer instantly with no quota limits.</p>
                </div>
                <button
                  onClick={handleGenerateVoiceoverLocally}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Generate with Browser Synthesizer (Offline)
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Quick Sample Script Carousel */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <h2 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Quick Test Templates (Click to load)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {SAMPLE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                onClick={() => handleSelectTemplate(tmpl)}
                className="group relative text-left p-3.5 bg-white hover:bg-slate-50/55 border border-slate-200 hover:border-indigo-400 rounded-2xl transition-all duration-300 hover:shadow-sm cursor-pointer"
                id={`template-btn-${tmpl.id}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {tmpl.title}
                  </span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] text-slate-600 font-bold rounded group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                    {tmpl.language}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                  {tmpl.description}
                </p>
                <div className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3 h-3 text-indigo-600" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDE: CREATOR TOOLS (Cols span 7) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* WORKSPACE CONTROL TABS */}
            <div className="bg-slate-100 border border-slate-200 rounded-2xl p-1.5 flex gap-1">
              <button
                onClick={() => setActiveTab('write')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                  activeTab === 'write'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
                id="tab-write-script"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Write / Paste Script</span>
              </button>
              
              <button
                onClick={() => setActiveTab('generate')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                  activeTab === 'generate'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
                id="tab-ai-generate"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>AI Script Generator</span>
              </button>
            </div>

            {/* TAB INTERFACE: SCRIPT WORK AREA */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 relative shadow-sm">
              <AnimatePresence mode="wait">
                {activeTab === 'write' ? (
                  <motion.div
                    key="write"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                        Video Script Text
                      </label>
                      <button
                        onClick={() => { setScript(''); setError(null); }}
                        className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors font-semibold cursor-pointer"
                        title="Clear Script"
                      >
                        Clear Text
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        value={script}
                        onChange={(e) => {
                          setScript(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Paste your script here. It can be fully in English, pure Hindi, or Hinglish (e.g. 'Dosto, aaj ki video bahut hi exciting hone waali hai...'). Use bracketed cues for visual pauses."
                        className="w-full h-60 bg-slate-50/50 text-slate-800 placeholder:text-slate-300 rounded-xl p-4 text-[13px] md:text-sm leading-relaxed border border-slate-200/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all duration-300 resize-none font-sans"
                        id="script-editor-textarea"
                      />
                      
                      {/* Live metrics indicator */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-3 bg-white/95 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-500 shadow-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Words:</span>
                          <span className="font-semibold text-slate-800">{activeWordCount}</span>
                        </div>
                        <div className="w-px h-3.5 bg-slate-200" />
                        <div className="flex items-center gap-1" title="Estimated duration based on average pacing">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span className="text-slate-400 font-bold uppercase text-[9px]">Est:</span>
                          <span className="font-semibold text-indigo-600">~{activeEstSeconds}s</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        onClick={handleOptimizeScript}
                        disabled={isOptimizing || isGenerating || !script.trim()}
                        className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-200 hover:border-indigo-350 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed text-indigo-600 shadow-sm"
                        id="optimize-script-btn"
                      >
                        {isOptimizing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Optimizing hooks...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Optimize Script for Shorts</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="generate"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form onSubmit={handleGenerateAIs_Script} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mb-1">
                          What is your video about?
                        </label>
                        <input
                          type="text"
                          value={aiTopic}
                          onChange={(e) => setAiTopic(e.target.value)}
                          placeholder="e.g. 3 psychology tricks to negotiate a higher salary"
                          className="w-full bg-slate-50 text-slate-800 placeholder:text-slate-350 rounded-xl p-3 text-xs border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                          id="ai-topic-input"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mb-1.5">
                            Target Duration
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {['15 seconds', '30 seconds', '60 seconds'].map((dur) => (
                              <button
                                key={dur}
                                type="button"
                                onClick={() => setAiDuration(dur)}
                                className={`py-2 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                                  aiDuration === dur
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {dur.replace(' seconds', 's')}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mb-1.5">
                            Spoken Tone
                          </label>
                          <select
                            value={aiTone}
                            onChange={(e) => setAiTone(e.target.value)}
                            className="w-full bg-slate-50 text-slate-700 rounded-lg p-2 text-xs border border-slate-200 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="energetic and viral">Viral Hook / Energetic</option>
                            <option value="calm and cinematic story">Calm / Storyteller</option>
                            <option value="humorous and sarcastic">Humorous & Sarcastic</option>
                            <option value="clear educator / tutorial">Clear Informational / Educator</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 tracking-wider uppercase block mb-1.5">
                            Script Language
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {['Hinglish', 'English', 'Hindi'].map((lang) => (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => setAiLanguage(lang)}
                                className={`py-2 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                                  aiLanguage === lang
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                                }`}
                              >
                                {lang}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isWritingScript || !aiTopic.trim()}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-950/15 cursor-pointer disabled:cursor-not-allowed mt-2"
                        id="generate-script-submit"
                      >
                        {isWritingScript ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Writing viral script with Gemini...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Generate Script with AI</span>
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CONFIGURATION PANEL: VOICE & STYLE DIRECTION */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
              
              {/* VOICE STYLE PRESETS SECTION */}
              <div className="space-y-3 pb-2 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Voice Style Presets
                  </label>
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded uppercase tracking-wider">
                    Quick Studio Presets
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2">
                  {VOICE_STYLE_PRESETS.map((preset) => {
                    const isActive = voiceName === preset.voiceName && performanceNote === preset.performanceNote;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setVoiceName(preset.voiceName);
                          setPerformanceNote(preset.performanceNote);
                        }}
                        className={`px-3 py-2 text-xs rounded-xl border transition-all duration-300 cursor-pointer flex flex-col text-left group/preset ${
                          isActive
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md animate-none'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-slate-300'
                        }`}
                        title={preset.performanceNote}
                        id={`preset-btn-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <span className="font-bold tracking-wide transition-colors">{preset.name}</span>
                        <span className={`text-[9px] font-medium ${isActive ? 'text-indigo-300' : 'text-slate-400'}`}>
                          {preset.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VOICE PICKER SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Select Voice Profile
                  </label>
                  <span className="text-[10px] text-indigo-600 font-mono font-bold uppercase">Prebuilt Profiles</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                  {PREBUILT_VOICES.map((v) => {
                    const isSelected = voiceName === v.name;
                    return (
                      <button
                        key={v.name}
                        onClick={() => setVoiceName(v.name)}
                        className={`p-3 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/40 border-indigo-500 shadow-sm'
                            : 'bg-slate-50/40 border-slate-200 hover:border-slate-350 hover:bg-slate-100/30'
                        }`}
                        id={`voice-btn-${v.name}`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {v.name}
                            </span>
                            <span className={`px-1 rounded text-[8px] font-bold uppercase ${
                              v.gender === 'Female' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {v.gender === 'Female' ? 'F' : 'M'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">
                            {v.description.split(' voice')[0]}
                          </p>
                        </div>

                        {/* Tag list */}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {v.tags.slice(0, 1).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] text-slate-500 font-semibold">
                              {t}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PERFORMANCE notes SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Performance Tone Direction (Optional)
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Customizes pacing & emotion</span>
                </div>

                <input
                  type="text"
                  value={performanceNote}
                  onChange={(e) => setPerformanceNote(e.target.value)}
                  placeholder="e.g. slow pacing, dramatic documentary narrator, warm and friendly tone"
                  className="w-full bg-slate-50 text-slate-850 placeholder:text-slate-300 rounded-xl p-3 text-xs border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-all"
                  id="performance-tone-input"
                />

                {/* Presets block */}
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">
                    Quick Tone Presets (Click to insert):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PERFORMANCE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPerformanceNote(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/50 rounded-lg text-[10px] text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                      >
                        {p.split(' vlogger')[0].split(' hook')[0].split(' narrator')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* GENERATE ACTION BUTTONS */}
            <div className="pt-1 space-y-3">
              <button
                onClick={handleGenerateVoiceover}
                disabled={isGenerating || isOptimizing || isWritingScript || !script.trim()}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 text-white font-display font-bold rounded-2xl flex items-center justify-center gap-3 transition-all duration-500 shadow-lg shadow-indigo-600/15 hover:scale-[1.005] cursor-pointer disabled:cursor-not-allowed disabled:scale-100"
                id="generate-voiceover-master-btn"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>{LOADING_MESSAGES[loadingMsgIdx]}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span className="tracking-wide text-xs md:text-sm">Generate Voiceover Track (Gemini API)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleGenerateVoiceoverLocally}
                disabled={isGenerating || isOptimizing || isWritingScript || !script.trim()}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 border border-slate-200 cursor-pointer disabled:cursor-not-allowed text-xs"
                id="generate-voiceover-local-btn"
              >
                <Volume2 className="w-4 h-4 text-slate-500" />
                <span>Use Local Browser Synthesizer (Unlimited & Offline)</span>
              </button>
            </div>

          </div>

          {/* RIGHT SIDE: PREVIEW & AUDIO LOG HISTORY (Cols span 5) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ACTIVE PLAYBACK CARD (Premium Sleek Dark Box) */}
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 shadow-xl relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                <Music className="w-3.5 h-3.5" />
                <span>Active Audioprint Workspace</span>
              </div>

              {activeAudioItem ? (
                <div className="space-y-6">
                  {/* Active Metadata */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-bold text-zinc-50 line-clamp-1">
                        {activeAudioItem.script.slice(0, 35)}...
                      </h3>
                      <span className="px-2.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-[9px] text-indigo-300 font-bold shrink-0 uppercase tracking-wider">
                        {activeAudioItem.voiceName} Voice
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed italic">
                      Performance: &ldquo;{activeAudioItem.performanceNote || "Standard reading"}&rdquo;
                    </p>
                  </div>

                  {/* CUSTOM AUDIO WAVEFORM GENERATOR */}
                  <div className="h-16 bg-slate-950/60 rounded-2xl flex items-center justify-center gap-1.5 px-4 border border-slate-850">
                    {barHeights.map((ht, idx) => (
                      <div
                        key={idx}
                        className={`w-1 rounded-full transition-all duration-100 ${
                          isPlaying 
                            ? 'bg-gradient-to-t from-indigo-500 to-indigo-300' 
                            : 'bg-slate-800'
                        }`}
                        style={{ height: `${ht}%` }}
                      />
                    ))}
                  </div>

                  {/* NATIVE SEEK CONTROLS */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioProgress}
                      onChange={handleSeek}
                      className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1"
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>{audioRef.current ? Math.floor(audioRef.current.currentTime) : 0}s</span>
                      <span>{Math.round(audioDuration)}s estimated</span>
                    </div>
                  </div>

                  {/* CONTROLS BAR */}
                  <div className="flex gap-2">
                    <button
                      onClick={togglePlay}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                      id="active-player-play-btn"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 fill-current text-white" />
                          <span>Pause Track</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current text-white" />
                          <span>Play Preview</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={(e) => triggerDownload(activeAudioItem, e)}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer text-slate-200 transition-all active:scale-95"
                      title="Download high fidelity WAV"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl">
                  <Volume2 className="w-9 h-9 text-slate-750 mb-3" />
                  <span className="text-slate-300 font-semibold text-xs">No audio loaded</span>
                  <p className="text-[10px] text-slate-500 max-w-xs mt-1 leading-relaxed">
                    Choose a template or write your text and click &ldquo;Generate Voiceover Track&rdquo; to experience the prebuilt model profiles.
                  </p>
                </div>
              )}
            </div>

            {/* GENERATION HISTORY LOGS (Light Sleek Style) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListRestart className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Voiceover History
                  </h3>
                </div>
                {history.length > 0 && (
                  <button
                    onClick={() => { saveHistory([]); setActiveAudioItem(null); }}
                    className="text-[10px] text-slate-400 hover:text-indigo-600 font-bold uppercase cursor-pointer transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {history.length > 0 ? (
                  history.map((item) => {
                    const isActive = activeAudioItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectHistoryItem(item)}
                        className={`p-3 rounded-2xl border transition-all duration-300 text-left cursor-pointer group flex items-start gap-3 relative ${
                          isActive
                            ? 'bg-indigo-50/50 border-indigo-200 shadow-xs'
                            : 'bg-slate-50/50 border-slate-100/80 hover:border-slate-200 hover:bg-slate-100/40'
                        }`}
                      >
                        <button className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isActive && isPlaying 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-200 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600'
                        }`}>
                          {isActive && isPlaying ? (
                            <Pause className="w-3 h-3 fill-current" />
                          ) : (
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-750 line-clamp-1">
                            {item.script}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 bg-slate-200/80 text-slate-600 rounded text-[9px] font-bold">
                              {item.voiceName}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {item.durationEst}s &bull; {formatTime(item.timestamp)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => triggerDownload(item, e)}
                            className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600 cursor-pointer transition-colors"
                            title="Download WAV file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteHistoryItem(item.id, e)}
                            className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                            title="Delete track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <p className="text-xs font-medium">No generations saved yet.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Brand footer from Sleek Interface */}
        <footer className="mt-12 py-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 shrink-0">
          <div className="flex space-x-4 mb-2 sm:mb-0">
            <span className="flex items-center gap-1.5 font-semibold text-slate-500">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Status: Ready
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-slate-500">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              Cloud Sync: Active
            </span>
          </div>
          <div className="font-semibold text-slate-400">Powered by Gemini Voice Engine v2.4</div>
        </footer>

      </div>
    </div>
  );
}
