import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonIdToLessonModel1778000000000 implements MigrationInterface {
  name = 'AddLessonIdToLessonModel1778000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lesson_model" ADD "lessonId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "lesson_model" ADD CONSTRAINT "FK_lesson_model_lesson" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lesson_model" DROP CONSTRAINT "FK_lesson_model_lesson"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_model" DROP COLUMN "lessonId"`,
    );
  }
}
