import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1778600000000 implements MigrationInterface {
  name = 'AddPerformanceIndexes1778600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_languageId_stageId_createdAt" ON "lesson" ("languageId", "stageId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_lessonId" ON "quiz" ("lessonId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_quiz_submission_userId_quizId" ON "quiz_submission" ("userId", "quizId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_moderator_permission_userId" ON "moderator_permission" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_variant_baseLessonId_regionId" ON "lesson_variant" ("baseLessonId", "regionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sign_recording_signId_regionId" ON "sign_recording" ("signId", "regionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_model_lessonVariantId" ON "lesson_model" ("lessonVariantId")`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_model_ready_lessonId_modelType" ON "lesson_model" ("lessonId", "modelType") WHERE "status" = 'READY'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sign_recording_validated_signId_regionId" ON "sign_recording" ("signId", "regionId") WHERE "isValidated" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_region_default_languageId" ON "region" ("languageId") WHERE "isDefault" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_lesson_variant_base_baseLessonId" ON "lesson_variant" ("baseLessonId") WHERE "isBase" = true`,
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_stages_languageId" ON "stages" ("languageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_region_languageId" ON "region" ("languageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_region_code" ON "region" ("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_question_quizId" ON "question" ("quizId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_option_questionId" ON "option" ("questionId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sign_variant_signId_regionId" ON "sign_variant" ("signId", "regionId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_lesson_userId_lessonId" ON "user_lesson" ("userId", "lessonId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_user_googleId" ON "user" ("googleId") WHERE "googleId" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_user_googleId"`);
    await queryRunner.query(`DROP INDEX "UQ_user_lesson_userId_lessonId"`);
    await queryRunner.query(`DROP INDEX "IDX_sign_variant_signId_regionId"`);
    await queryRunner.query(`DROP INDEX "IDX_option_questionId"`);
    await queryRunner.query(`DROP INDEX "IDX_question_quizId"`);
    await queryRunner.query(`DROP INDEX "IDX_region_code"`);
    await queryRunner.query(`DROP INDEX "IDX_region_languageId"`);
    await queryRunner.query(`DROP INDEX "IDX_stages_languageId"`);
    await queryRunner.query(
      `DROP INDEX "IDX_lesson_variant_base_baseLessonId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_region_default_languageId"`);
    await queryRunner.query(
      `DROP INDEX "IDX_sign_recording_validated_signId_regionId"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_lesson_model_ready_lessonId_modelType"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_lesson_model_lessonVariantId"`);
    await queryRunner.query(`DROP INDEX "IDX_sign_recording_signId_regionId"`);
    await queryRunner.query(
      `DROP INDEX "IDX_lesson_variant_baseLessonId_regionId"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_moderator_permission_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_quiz_submission_userId_quizId"`);
    await queryRunner.query(`DROP INDEX "IDX_quiz_lessonId"`);
    await queryRunner.query(
      `DROP INDEX "IDX_lesson_languageId_stageId_createdAt"`,
    );
  }
}
