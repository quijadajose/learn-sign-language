import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUniqueLowerEmailIndex1778800000000 implements MigrationInterface {
  name = 'AddUniqueLowerEmailIndex1778800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates: { email: string }[] = await queryRunner.query(
      `SELECT lower("email") AS email FROM "user" GROUP BY lower("email") HAVING COUNT(*) > 1`,
    );

    if (duplicates.length > 0) {
      throw new Error(
        `Cannot create unique index on lower(email): ${duplicates.length} duplicate email(s) exist. Resolve them before running this migration.`,
      );
    }

    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_email_lower_unique" ON "user" (lower("email"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_email_lower_unique"`);
  }
}
