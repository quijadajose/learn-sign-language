import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRecordingValidationAndSignDetectionType1778100000000 implements MigrationInterface {
  name = 'AddRecordingValidationAndSignDetectionType1778100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."sign_detectiontype_enum" AS ENUM('static', 'dynamic')`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign" ADD "detectionType" "public"."sign_detectiontype_enum" NOT NULL DEFAULT 'static'`,
    );
    // Default false: grabaciones históricas no se consideran validadas
    // hasta backfill (scripts/audit-recordings.mjs) o nueva captura.
    await queryRunner.query(
      `ALTER TABLE "sign_recording" ADD "isValidated" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_recording" ADD "handConfidence" double precision`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sign_recording" DROP COLUMN "handConfidence"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_recording" DROP COLUMN "isValidated"`,
    );
    await queryRunner.query(`ALTER TABLE "sign" DROP COLUMN "detectionType"`);
    await queryRunner.query(`DROP TYPE "public"."sign_detectiontype_enum"`);
  }
}
