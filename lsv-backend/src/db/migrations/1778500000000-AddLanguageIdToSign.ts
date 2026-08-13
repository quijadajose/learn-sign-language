import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLanguageIdToSign1778500000000 implements MigrationInterface {
  name = 'AddLanguageIdToSign1778500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sign" ADD "languageId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "sign" ADD CONSTRAINT "FK_sign_languageId" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_sign_languageId" ON "sign" ("languageId")`,
    );
    // Backfill from linked lessons (pick any language if a sign spans multiple).
    await queryRunner.query(`
      UPDATE "sign" s
      SET "languageId" = sub."languageId"
      FROM (
        SELECT DISTINCT ON (ls."signId")
          ls."signId",
          l."languageId"
        FROM "lesson_signs" ls
        INNER JOIN "lesson" l ON l."id" = ls."lessonId"
        WHERE l."languageId" IS NOT NULL
        ORDER BY ls."signId", l."languageId"
      ) sub
      WHERE s."id" = sub."signId"
        AND s."languageId" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_sign_languageId"`);
    await queryRunner.query(
      `ALTER TABLE "sign" DROP CONSTRAINT "FK_sign_languageId"`,
    );
    await queryRunner.query(`ALTER TABLE "sign" DROP COLUMN "languageId"`);
  }
}
