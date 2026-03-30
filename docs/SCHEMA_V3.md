# Medico Hub - V3 Firestore Schema Blueprint

## 1. Collection: `users`
Profiles for all students.
```typescript
interface UserDocument {
  uid: string;
  // Profile
  name: string;
  email: string;
  role: 'student' | 'admin';
  academicYear: 'Year 1' | 'Year 2' | 'Clinical' | 'Final Year'; // Tags for filtering content
  institution: string;
  
  // Account Status
  isSubscribed: boolean; // "Pro" status
  subscriptions: {
    planId: string;
    startDate: Timestamp;
    endDate: Timestamp;
  }[];
  
  // MCAMP Specifics
  mcamp?: {
    isEnrolled: boolean;
    cohortId: string; // e.g., "cohort_2024_Q1"
    uniqueId: string; // "MH-MCAMP-001"
    enrollmentDate: Timestamp;
  };
  
  // Activity Summaries (Aggregated daily by Cloud Functions/Backend)
  analytics: {
    totalSecondsStudied: number;
    pointsEarned: number;
    streakDays: number;
    lastActive: Timestamp;
  };
}
```

## 2. Collection: `resources`
The master library of all learning content (Academy + MCAMP).
```typescript
interface ResourceDocument {
  id: string; // Auto-ID
  title: string;
  description: string;
  
  // Categorization
  type: 'Video' | 'PDF' | 'Article' | 'Quiz';
  subject: 'Anatomy' | 'Physiology' | 'Biochemistry' | 'Pathology' | 'Pharmacology' | 'General';
  tags: string[]; // ["Year 2", "MCAMP_Wk1", "Cardiology"] -> Matches User.academicYear
  
  // Access Control
  isPro: boolean; // Requires Subscription
  isMcampExclusive: boolean; // Requires MCAMP enrollment
  
  // Content Links
  url: string; // Link to Cloud Storage, YouTube, or Text content
  thumbnailUrl: string; // Uploaded by Admin
  downloadUrl?: string; // Optional (Admin can disable downloads)
  hasAiAccess: boolean; // Enables the context-aware chatbot for this resource
  
  // Metadata
  uploadedBy: string; // Admin UID
  createdAt: Timestamp;
}
```

## 3. Collection: `analytics_logs` -> Subcollection `sessions`
Granular tracking of USER BEHAVIOR. This is the raw data for the dashboard.
Path: `users/{uid}/activity_sessions/{sessionId}`
```typescript
interface ActivitySession {
  id: string;
  resourceId: string;
  resourceType: 'Video' | 'PDF' | ...;
  startTime: Timestamp;
  endTime: Timestamp;
  durationSeconds: number; // Calculated on client disconnect/cleanup
  
  // Detailed Interactions (JSON Blob)
  interactions: {
    scrolledToPage?: number; // For PDFs
    videoWatchPercent?: number; // For Videos
    aiQueriesAsked?: number;
    quizScore?: number;
  };
}
```

## 4. Collection: `quizzes`
Detailed Quiz configurations.
```typescript
interface QuizDocument {
  id: string;
  resourceId: string; // Links to the parent Resource
  
  // Configuration
  timeLimitMinutes: number;
  passingScore: number;
  weekNumber?: number; // For MCAMP
  
  // Content
  questions: {
    id: string;
    type: 'SBO' | 'MCQ' | 'FILL_GAP' | 'IMAGE_ID' | 'ESSAY';
    prompt: string;
    imageUrl?: string; // For Image ID questions
    options?: string[]; // ["A. Valve", "B. Aorta"]
    correctAnswer: any; // Stored securely. Hidden from client fetching "Take Quiz".
    points: number;
    explanation: string; // Shown after grading
  }[];
}
```

## 5. Collection: `quiz_attempts`
Results of user quizzes.
Path: `quiz_attempts/{attemptId}`
```typescript
interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  mcampCohortId?: string; // If part of MCAMP
  
  startTime: Timestamp;
  submittedAt: Timestamp;
  
  answers: Record<string, any>; // { "q1": "Option A", "q2": "Heart" }
  score: number;
  status: 'graded' | 'pending_review'; // 'pending_review' for Essays
  
  // Admin Feedback
  adminComments?: string;
}
```

## 6. Collection: `notifications`
System and Admin-pushed alerts.
```typescript
interface NotificationDocument {
  id: string;
  targetAudience: 'all' | 'year_2' | 'pro_users' | 'mcamp'; // Who sees this?
  title: string;
  message: string;
  type: 'info' | 'alert' | 'success'; 
  link?: string; // Where clicking takes you
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
```

## 7. Collection: `products` (Store)
Publicly accessible store items.
```typescript
interface ProductDocument {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: 'Textbooks' | 'Essentials' | 'Stationery';
  stockCount: number;
  isFeatured: boolean;
}
```

## 8. Collection: `mcamp_cohorts`
Settings for the MCAMP program instances.
```typescript
interface McampCohort {
  id: string; // "cohort_2024_Q1"
  isActive: boolean;
  startDate: Timestamp;
  endDate: Timestamp; // The "Day Counter" calculates against this
  currentWeek: number; // Controlled by Admin to unlock weekly quizzes
  
  totalSlots: number; // e.g., 20
  enrolledCount: number;
}
```
