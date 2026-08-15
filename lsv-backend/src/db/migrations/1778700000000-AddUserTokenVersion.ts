import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserTokenVersion1778700000000 implements MigrationInterface {
  name = 'AddUserTokenVersion1778700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "tokenVersion" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tokenVersion"`);
  }
}
