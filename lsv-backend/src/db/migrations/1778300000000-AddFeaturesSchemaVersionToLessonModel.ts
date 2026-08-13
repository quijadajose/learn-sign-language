import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddFeaturesSchemaVersionToLessonModel1778300000000 implements MigrationInterface {
  name = 'AddFeaturesSchemaVersionToLessonModel1778300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lesson_model" ADD "featuresSchemaVersion" character varying(32)`,
    );
    await queryRunner.query(`
      UPDATE "lesson_model"
      SET "featuresSchemaVersion" = CASE
        WHEN "modelType" = 'static' THEN 'static-v1'
        WHEN "featuresCount" = 384 THEN 'dynamic-v2'
        ELSE 'dynamic-v1'
      END
      WHERE "featuresSchemaVersion" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lesson_model" DROP COLUMN "featuresSchemaVersion"`,
    );
  }
}
