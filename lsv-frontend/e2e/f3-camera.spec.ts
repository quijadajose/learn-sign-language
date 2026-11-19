import { expect, test } from "./fixtures/roles";
import { readFile } from "node:fs/promises";

test("practice reports a missing trained model instead of remaining in loading", async ({
  studentPage,
}) => {
  const curriculum = JSON.parse(
    await readFile("e2e/.auth/curriculum.json", "utf8"),
  ) as { lessonId: string };
  await studentPage.context().grantPermissions(["camera"]);
  await studentPage.goto(`/lesson/${curriculum.lessonId}/practice`);
  await expect(
    studentPage.getByText(
      /no trained model|no se encontró un modelo entrenado/i,
    ),
  ).toBeVisible({ timeout: 15000 });
});
