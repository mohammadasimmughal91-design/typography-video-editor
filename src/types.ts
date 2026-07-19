export interface VoiceoverHistoryItem {
  id: string;
  script: string;
  voiceName: string;
  performanceNote: string;
  audioUrl: string;
  durationEst: number;
  timestamp: number;
}

export interface PrebuiltVoice {
  name: string;
  gender: 'Male' | 'Female';
  description: string;
  tags: string[];
}

export interface SampleTemplate {
  id: string;
  title: string;
  script: string;
  description: string;
  language: string;
  suggestedVoice: string;
  suggestedPerformance: string;
}
