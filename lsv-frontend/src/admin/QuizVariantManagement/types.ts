export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  optionVariants: QuizOption[];
}

export interface QuizVariant {
  id: string;
  lessonVariant: {
    id: string;
    name: string;
    region: {
      id: string;
      name: string;
      code: string;
    };
  };
  questionVariants: QuizQuestion[];
}

export interface LessonVariant {
  id: string;
  name: string;
  region: {
    id: string;
    name: string;
    code: string;
  };
  isBase: boolean;
  isRegionalSpecific: boolean;
}

export interface VariantQuestionForm {
  question: string;
  options: Array<{ text: string; isCorrect: boolean }>;
}

export const emptyVariantQuestion = (): VariantQuestionForm => ({
  question: "",
  options: [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});
