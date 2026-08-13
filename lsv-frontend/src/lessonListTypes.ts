export interface Question {
  questionId: string;
  questionText: string;
  submittedOptionId: string;
  optionText: string;
  isCorrect: boolean;
}

export interface Submission {
  submissionId: string;
  score: number;
  submittedAt: string;
  questions: Question[];
}

export interface Lesson {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  maxScore: number;
  submissions: Submission[];
  regionId?: string;
  hasReadyModel?: boolean;
  hasQuiz?: boolean;
}

export interface StageProgress {
  id: string;
  name: string;
  description: string;
  totalLessons: string;
  completedLessons: string;
  progress: string | null;
}
