import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * BE-10: cada modelo guarda su idioma. Los modelos custom no tienen lección, y sin
 * idioma el guard no puede autorizar a un moderador sobre ellos.
 */
export class AddLanguageIdToLessonModel1778900000000 implements MigrationInterface {
  name = 'AddLanguageIdToLessonModel1778900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lesson_model" ADD "languageId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "lesson_model" ADD CONSTRAINT "FK_lesson_model_languageId" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_model_languageId" ON "lesson_model" ("languageId")`,
    );
    // Backfill: idioma de la lección del modelo.
    await queryRunner.query(`
      UPDATE "lesson_model" m
      SET "languageId" = l."languageId"
      FROM "lesson" l
      WHERE m."lessonId" = l."id"
        AND m."languageId" IS NULL
        AND l."languageId" IS NOT NULL
    `);
    // Backfill: idioma de la lección base de la variante.
    await queryRunner.query(`
      UPDATE "lesson_model" m
      SET "languageId" = l."languageId"
      FROM "lesson_variant" v
      INNER JOIN "lesson" l ON l."id" = v."baseLessonId"
      WHERE m."lessonVariantId" = v."id"
        AND m."languageId" IS NULL
        AND l."languageId" IS NOT NULL
    `);
    // Los modelos custom antiguos no guardaban su idioma: quedan en NULL (solo admin).
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_lesson_model_languageId"`);
    await queryRunner.query(
      `ALTER TABLE "lesson_model" DROP CONSTRAINT "FK_lesson_model_languageId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_model" DROP COLUMN "languageId"`,
    );
  }
}
