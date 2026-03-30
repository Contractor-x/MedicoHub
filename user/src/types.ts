
export interface User {
  name: string;
  firstName?: string;
  surname?: string;
  email?: string;
  phoneNumber?: string;
  schoolName?: string;
  year: string;
  academicYear: string;
  weakness: string[];
  currentCourses?: string[];
  isSubscribed: boolean;
  profileImage?: string;
  joinedDate: string; // ISO Date string
  mcamp?: {
    isEnrolled: boolean;
    cohortId: string;
    uniqueId: string;
    startDate: string; // ISO Date of cohort start
    isSuspended?: boolean;
    suspensionDate?: string;
  };
  quizAttempts?: Record<string, {
    status: 'completed' | 'pending_grading';
    score?: number;
    submittedAt: string;
  }>;
  analytics?: {
    totalHours: number;
    topicsMastered: number;
    currentStreak: number;
    lastStudyDate: string; // ISO String
    monthlyActivity: { date: string; hours: number }[]; // Last 30 days
    yearlyActivity: { month: string; hours: number }[]; // 12 months
  };
  emailVerified?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success';
  date: string;
  read: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  condition: { label: string; color: string; } | string;
}

export type QuestionType = 'SBO' | 'MCQ' | 'FILL_GAP' | 'IMAGE_ID' | 'ESSAY' | 'MFIB';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  image?: string;
  options?: string[]; // For SBO and MCQ
  correctAnswer?: string | string[] | number | number[]; // Hidden from user
  explanation?: string; // Hidden from user until allowed
}

export interface QuizSession {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  weekNumber: number;
}

export interface Resource {
  id: string;
  title: string;
  type: 'Video' | 'PDF' | 'Quiz' | 'Article';
  subject: string;
  year?: string;
  dateAdded: string;
  isPro: boolean;
  isYoutube?: boolean;
  url?: string;
  thumbnailUrl?: string;
  embedCode?: string;
  downloadUrl?: string;
  canDownload?: boolean;
  quizData?: any[]; // For Quiz type
  isMcampExclusive?: boolean;
  tags?: string[];
  progress?: number; // Added for UI display
}

export interface ResourceProgress {
  resourceId: string;
  userId: string;
  progress: number; // 0 to 100
  type: 'Video' | 'PDF' | 'Quiz' | 'Article';
  completed: boolean;
  lastUpdated: string;
  metadata?: {
    watchedSeconds?: number[]; // Unique seconds watched
    viewedPages?: number[]; // Unique pages viewed
    totalDuration?: number;
    totalPages?: number;
    quizScore?: number;
    quizTotal?: number;
  };
}


export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export enum AppRoute {
  HOME = '/',
  SIGNUP = '/signup',
  ONBOARDING = '/onboarding',
  LOGIN = '/login',
  FORGOT_PASSWORD = '/forgot-password',
  DASHBOARD = '/dashboard',
  STORE = '/store',
  ABOUT = '/about',
  PRICING = '/pricing',
  PROFILE = '/profile',
  LEARNING = '/learning',
  MCAMP = '/mcamp',
  MCAMP_DASHBOARD = '/dashboard/mcamp',
  PRIVACY = '/privacy',
  TERMS = '/terms',
  LEGAL = '/legal'
}
