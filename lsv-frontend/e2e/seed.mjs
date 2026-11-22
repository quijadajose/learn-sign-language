export async function seedCurriculum(api, token) {
  async function post(path, body) {
    const result = await fetch(`${api}${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!result.ok) throw new Error(`POST ${path} returned ${result.status}`);
    return result.json();
  }
  const suffix = `pw-${Date.now()}`;
  const language = await post("/languages", {
    name: `Playwright ${suffix}`,
    description: "e2e fixture",
    countryCode: "US",
  });
  const region = await post("/region", {
    name: `Region ${suffix}`,
    code: suffix.slice(-10),
    description: "e2e fixture",
    languageId: language.id,
  });
  await post("/region", {
    name: `Alternate ${suffix}`,
    code: `${suffix.slice(-8)}B`,
    description: "alternate e2e region",
    languageId: language.id,
  });
  const stage = await post("/stage", {
    name: `Stage ${suffix}`,
    description: "e2e fixture",
    languageId: language.id,
  });
  const lesson = await post("/lesson", {
    name: `Lesson ${suffix}`,
    description: "e2e fixture",
    content: "Fixture lesson",
    languageId: language.id,
    stageId: stage.id,
  });
  const variant = await post(`/lesson/${lesson.id}/variants`, {
    name: `Variant ${suffix}`,
    description: "e2e fixture",
    content: "Fixture regional lesson",
    regionId: region.id,
  });
  const quiz = await post("/quiz", {
    lessonId: lesson.id,
    questions: [
      {
        text: "Test question",
        options: [
          { text: "Correct", isCorrect: true },
          { text: "Other", isCorrect: false },
        ],
      },
    ],
  });
  const sign = await post("/sign-record/sign", {
    name: `Sign ${suffix}`,
    languageId: language.id,
    lessonId: lesson.id,
  });
  return {
    languageName: language.name,
    regionName: region.name,
    stageName: stage.name,
    lessonName: lesson.name,
    variantName: variant.name,
    languageId: language.id,
    regionId: region.id,
    stageId: stage.id,
    lessonId: lesson.id,
    lessonVariantId: variant.id,
    quizId: quiz.id,
    signId: sign.id,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const api = process.env.PLAYWRIGHT_API_URL ?? "http://127.0.0.1:3001";
  const response = await fetch(`${api}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: process.env.API_ADMIN_EMAIL,
      password: process.env.API_ADMIN_PASSWORD,
    }),
  });
  if (!response.ok)
    throw new Error(`Admin login failed with status ${response.status}`);
  const cookie = response.headers
    .get("set-cookie")
    ?.match(/lsv_access=([^;,]+)/)?.[1];
  if (!cookie)
    throw new Error("Admin API login did not return the session cookie");
  const token = decodeURIComponent(cookie);
  console.log(JSON.stringify(await seedCurriculum(api, token)));
}
