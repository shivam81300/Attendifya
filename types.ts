
export interface AttendanceEntry {
  id: string;
  timestamp: number;
  type: 'present' | 'absent';
}

export interface SubjectSchedule {
  day: number; // 0-6 (Sun-Sat)
  time: string; // HH:mm format
}

export interface Subject {
  id: string;
  name: string;
  teacherName?: string;
  present: number;
  total: number;
  history: AttendanceEntry[];
  color: string;
  schedule: SubjectSchedule[];
}

export interface AppState {
  subjects: Subject[];
  goalPercentage: number;
}

export enum AppRoute {
  HOME = 'home',
  DETAILS = 'details',
  ANALYTICS = 'analytics',
  AI_CHAT = 'ai-chat',
  SETTINGS = 'settings'
}

export interface TranscriptionHistoryItem {
  text: string;
  role: 'user' | 'model';
}
