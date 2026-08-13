export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
  lessonId: string;
}

export interface NewQuizQuestion {
  text: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}
