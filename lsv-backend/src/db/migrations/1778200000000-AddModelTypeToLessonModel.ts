import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddModelTypeToLessonModel1778200000000 implements MigrationInterface {
  name = 'AddModelTypeToLessonModel1778200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."lesson_model_modeltype_enum" AS ENUM('static', 'dynamic')`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_model" ADD "modelType" "public"."lesson_model_modeltype_enum" NOT NULL DEFAULT 'static'`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_model" ADD "featuresCount" integer NOT NULL DEFAULT 258`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lesson_model" DROP COLUMN "featuresCount"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_model" DROP COLUMN "modelType"`,
    );
    await queryRunner.query(`DROP TYPE "public"."lesson_model_modeltype_enum"`);
  }
}
