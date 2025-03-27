// --- User Mocks ---
export const mockUser1 = {
  id: 'a7460593-5a86-42ab-8823-7f2c316b3290',
  email: 'darkwitch760@gmail.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date('2025-02-17T01:45:16.018Z'), // Ajustado a UTC para consistencia
  age: 30,
  isRightHanded: true,
  updatedAt: new Date('2025-03-25T20:30:05.000Z'), // Ajustado a UTC
  role: 'admin',
  userLessons: [], // Se poblará más abajo
  quizSubmissions: [], // Se poblará más abajo
};

export const mockUser2 = {
  id: 'd6167bf8-a9b7-4e0b-97ad-d5318e2745f3',
  email: '1darkwitch760@gmail.com',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date('2025-03-25T19:02:15.603Z'), // Ajustado a UTC
  age: 30,
  isRightHanded: true,
  updatedAt: new Date('2025-03-25T19:02:15.603Z'), // Ajustado a UTC
  role: 'admin',
  userLessons: [],
  quizSubmissions: [],
};

// --- Language Mocks ---
export const mockLanguage1 = {
  id: '73cc7c60-030e-4e77-b9a2-16ab3035c967',
  name: 'Lenguaje de señas Chileno',
  description:
    'El sistema de comunicación visual usado por la comunidad sorda.',
  createdAt: new Date('2025-02-17T01:46:19.959Z'), // Ajustado a UTC
  updatedAt: new Date('2025-02-17T01:46:19.959Z'), // Ajustado a UTC
  stages: [], // Se poblará más abajo
  lessons: [], // Se poblará más abajo
};

export const mockLanguage2 = {
  id: '1c28b38b-be81-4cf4-b54b-f68bb81b28ee',
  name: 'Lenguaje de señas Venezolano',
  description:
    'El sistema de comunicación visual usado por la comunidad sorda.',
  createdAt: new Date('2025-02-18T19:35:13.308Z'), // Ajustado a UTC
  updatedAt: new Date('2025-02-18T19:35:13.308Z'), // Ajustado a UTC
  stages: [], // Se poblará más abajo
  lessons: [], // Se poblará más abajo
};

// --- Stage Mocks ---
export const mockStage1_Lang1 = {
  id: 'fa22c61f-87f5-41e8-aa17-894b4307ccf5',
  name: 'A I',
  description:
    'You can use basic vocabulary and expressions to communicate in simple, routine tasks.',
  createdAt: new Date('2025-02-17T01:46:46.939Z'), // Ajustado a UTC
  updatedAt: new Date('2025-02-17T01:48:45.166Z'), // Ajustado a UTC
  language: mockLanguage1,
  lessons: [], // Se poblará más abajo
};
// ... (puedes crear mocks para otros stages si los necesitas)
export const mockStage1_Lang2 = {
  id: 'd0f6e8bd-d051-457c-824e-a5b61d572eac',
  name: 'A I',
  description:
    'You can use basic vocabulary and expressions to communicate in simple, routine tasks.',
  createdAt: new Date('2025-02-18T20:32:27.592Z'), // Ajustado a UTC
  updatedAt: new Date('2025-02-18T20:32:27.592Z'), // Ajustado a UTC
  language: mockLanguage2,
  lessons: [], // Se poblará más abajo
};

// --- Lesson Mocks ---
export const mockLesson1 = {
  id: '932be075-e5cb-4004-9bea-52a73d3dc193',
  name: 'El abecedario',
  description: 'El abecedario de la A a la Z.',
  content: 'A,B,C ... , X,Y,Z',
  createdAt: new Date('2025-02-17T01:50:55.502Z'), // Ajustado a UTC
  updatedAt: new Date('2025-02-17T01:50:55.502Z'), // Ajustado a UTC
  language: mockLanguage1,
  stage: mockStage1_Lang1,
  userLessons: [], // Se poblará más abajo
  quizzes: [], // Se poblará más abajo
};

export const mockLesson2 = {
  id: '7724f526-3fbf-4112-b3ab-752593312dcf',
  name: 'El abecedario',
  description: 'El abecedario de la A a la Z.',
  content: 'A,B,C ... , X,Y,Z',
  createdAt: new Date('2025-02-18T21:19:45.069Z'), // Ajustado a UTC
  updatedAt: new Date('2025-02-18T21:19:45.069Z'), // Ajustado a UTC
  language: mockLanguage2,
  stage: mockStage1_Lang2,
  userLessons: [],
  quizzes: [], // Se poblará más abajo
};

// --- Quiz Mocks ---
export const mockQuiz1 = {
  id: '31179d8c-59bb-4f54-b480-e1f715cf0633',
  lesson: mockLesson1,
  submissions: [], // Se poblará más abajo
  questions: [], // Se poblará más abajo
};

export const mockQuiz2 = {
  // Nota: ID no es un UUID válido en los datos, usando tal cual
  id: 'xw65c67g-87f5-41e8-aa17-894b4307uuh4',
  lesson: mockLesson2,
  submissions: [],
  questions: [],
};

export const mockQuiz3 = {
  // Nota: ID no es un UUID válido en los datos, usando tal cual
  id: 'zw65c67g-87f5-41e8-aa17-894b4307uuh4',
  lesson: mockLesson1, // Asociado a la misma lección que mockQuiz1
  submissions: [],
  questions: [],
};

// --- Question Mocks ---
export const mockQuestion1 = {
  id: '2556de92-f8c8-4cf2-9ee0-6b1e0a6443a2',
  text: '¿Cual es 2 + 2?',
  quiz: mockQuiz1,
  options: [], // Se poblará más abajo
};

export const mockQuestion2 = {
  id: 'af532fc6-da56-47a8-a586-7095c5f56565',
  text: '¿Cuál es la capital de Francia?',
  quiz: mockQuiz1,
  options: [], // Se poblará más abajo
};

// --- Option Mocks ---
// Opciones para Question 1
export const mockOption1_Q1 = {
  id: 'a4808893-7f23-42cb-beae-83e8af2de7f1',
  text: '4',
  isCorrect: true,
  question: mockQuestion1,
};

export const mockOption2_Q1 = {
  id: '5e93477d-023d-416f-a29c-0c0465e117c8',
  text: '5',
  isCorrect: false,
  question: mockQuestion1,
};

// Opciones para Question 2
export const mockOption1_Q2 = {
  id: '5aefad50-4dfb-4429-9d9c-47a10f71127e',
  text: 'París',
  isCorrect: true,
  question: mockQuestion2,
};

export const mockOption2_Q2 = {
  id: '7452ae28-dd5d-4169-93cb-300cd5f8c65e',
  text: 'Madrid',
  isCorrect: false,
  question: mockQuestion2,
};

export const mockOption3_Q2 = {
  id: '786ea702-ff47-4c9b-ad5d-6484600ffaca',
  text: 'Roma',
  isCorrect: false,
  question: mockQuestion2,
};

export const mockOption4_Q2 = {
  id: 'dbf63f81-1b92-4b50-a1d7-6506b8c5c26c',
  text: 'Berlín',
  isCorrect: false,
  question: mockQuestion2,
};

// --- UserLesson Mock ---
export const mockUserLesson1 = {
  id: '2787c3bc-b25a-46ba-ba49-b890034cb284',
  isCompleted: true,
  completedAt: new Date('2025-02-17T00:31:06Z'), // Ajustado a UTC
  createdAt: new Date('2025-02-17T01:54:28.154Z'), // Ajustado a UTC
  user: mockUser1,
  lesson: mockLesson1,
};

// --- QuizSubmission Mocks ---
// Helper para parsear JSON, manejando posible doble escape
function parseQuizAnswers(jsonString) {
  try {
    let parsed = JSON.parse(jsonString);
    // Si el resultado sigue siendo una cadena, intenta parsear de nuevo
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {
        console.error(
          'Error parsing potentially double-encoded JSON:',
          jsonString,
          e,
        );
        return null; // o devuelve el string original, o un valor por defecto
      }
    }
    return parsed;
  } catch (error) {
    console.error('Error parsing JSON string:', jsonString, error);
    return null; // Devuelve null o un objeto vacío si falla el parseo
  }
}

export const mockQuizSubmission1 = {
  id: 'bd61f546-4da8-4b11-b216-83c70dd1906f',
  user: mockUser1,
  quiz: mockQuiz1,
  answers: parseQuizAnswers(
    '[{"questionId":"2556de92-f8c8-4cf2-9ee0-6b1e0a6443a2","optionId":"a4808893-7f23-42cb-beae-83e8af2de7f1"},{"questionId":"af532fc6-da56-47a8-a586-7095c5f56565","optionId":"5aefad50-4dfb-4429-9d9c-47a10f71127e"}]',
  ),
  score: 100,
  submittedAt: new Date('2025-02-27T19:43:49.213Z'), // Ajustado a UTC
};

export const mockQuizSubmission2 = {
  id: '288f1f2c-326b-4776-9b7b-41e47b395e2d',
  user: mockUser1,
  quiz: mockQuiz1,
  answers: parseQuizAnswers(
    '[{"questionId":"2556de92-f8c8-4cf2-9ee0-6b1e0a6443a2","optionId":"a4808893-7f23-42cb-beae-83e8af2de7f1"},{"questionId":"af532fc6-da56-47a8-a586-7095c5f56565","optionId":"7452ae28-dd5d-4169-93cb-300cd5f8c65e"}]',
  ),
  score: 50,
  submittedAt: new Date('2025-02-24T01:06:09.206Z'), // Ajustado a UTC
};

// --- Poblando las relaciones en los arrays ---

// Lenguajes -> Stages y Lessons
mockLanguage1.stages.push(mockStage1_Lang1); // Asumiendo que hay más stages para lang 1 en tus datos completos
mockLanguage1.lessons.push(mockLesson1);
mockLanguage2.stages.push(mockStage1_Lang2); // Asumiendo que hay más stages para lang 2
mockLanguage2.lessons.push(mockLesson2);

// Stages -> Lessons
mockStage1_Lang1.lessons.push(mockLesson1);
mockStage1_Lang2.lessons.push(mockLesson2);

// Lessons -> Quizzes y UserLessons
mockLesson1.quizzes.push(mockQuiz1, mockQuiz3);
mockLesson1.userLessons.push(mockUserLesson1);
mockLesson2.quizzes.push(mockQuiz2);

// Quizzes -> Questions y Submissions
mockQuiz1.questions.push(mockQuestion1, mockQuestion2);
mockQuiz1.submissions.push(mockQuizSubmission1, mockQuizSubmission2); // Añade más si es necesario
// mockQuiz2 y mockQuiz3 no tienen questions/submissions en los datos provistos

// Questions -> Options
mockQuestion1.options.push(mockOption1_Q1, mockOption2_Q1);
mockQuestion2.options.push(
  mockOption1_Q2,
  mockOption2_Q2,
  mockOption3_Q2,
  mockOption4_Q2,
);

// Users -> UserLessons y QuizSubmissions
mockUser1.userLessons.push(mockUserLesson1);
mockUser1.quizSubmissions.push(mockQuizSubmission1, mockQuizSubmission2); // Añade más si es necesario de tus datos
