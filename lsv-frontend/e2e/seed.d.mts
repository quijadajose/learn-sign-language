export function seedCurriculum(
  api: string,
  token: string,
): Promise<{
  languageId: string;
  regionId: string;
  stageId: string;
  lessonId: string;
  lessonVariantId: string;
  quizId: string;
  signId: string;
}>;
