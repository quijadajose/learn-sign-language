import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLessonModelLessonIdIndex1778400000000 implements MigrationInterface {
  name = 'AddLessonModelLessonIdIndex1778400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_model_lessonId" ON "lesson_model" ("lessonId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_lesson_model_lessonId"`);
  }
}
