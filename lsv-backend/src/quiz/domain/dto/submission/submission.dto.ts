export interface Answer {
  questionId: string;
  optionId: string;
}

export interface Submission {
  answers: Answer[];
}
