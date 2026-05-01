import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSignAndLessonModel1777142219660 implements MigrationInterface {
  name = 'AddSignAndLessonModel1777142219660';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "sign_variant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "landmarks" jsonb, "mediaUrl" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "signId" uuid, "regionId" uuid, CONSTRAINT "PK_2ea4c2aa7f8bb28878d326186a7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sign_recording" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "landmarks" jsonb NOT NULL, "dominantHand" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "signId" uuid, "regionId" uuid, CONSTRAINT "PK_6faebc1c7a66f348f55d8b07650" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sign" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "isGlobal" boolean NOT NULL DEFAULT false, "landmarks" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e3de9d3ec946837ec087cf0f54a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lesson_model" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."lesson_model_status_enum" NOT NULL DEFAULT 'PENDING', "modelJsonUrl" character varying, "binUrls" text, "accuracy" double precision, "progress" double precision NOT NULL DEFAULT '0', "trainingJobId" character varying, "labels" text, "name" character varying, "trainingLogs" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "lessonVariantId" uuid, CONSTRAINT "PK_43268921eee37c67d0bebaadf80" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lesson_signs" ("signId" uuid NOT NULL, "lessonId" uuid NOT NULL, CONSTRAINT "PK_e593dad19169ee98b107e2a3cb9" PRIMARY KEY ("signId", "lessonId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6b562cdedb0e253a03efe54191" ON "lesson_signs" ("signId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9c47f331f791b8df90f7be6aa5" ON "lesson_signs" ("lessonId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_variant" ADD CONSTRAINT "FK_8eaa0246fce0d75799a1aee031b" FOREIGN KEY ("signId") REFERENCES "sign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_variant" ADD CONSTRAINT "FK_863b1276fbabe80ad66da412d18" FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_recording" ADD CONSTRAINT "FK_330d0a656e78855619659f64821" FOREIGN KEY ("signId") REFERENCES "sign"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_recording" ADD CONSTRAINT "FK_98258d6a3ec4bbf05ad25e2833f" FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_model" ADD CONSTRAINT "FK_f85ced7f8dacffd6050931393bb" FOREIGN KEY ("lessonVariantId") REFERENCES "lesson_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_signs" ADD CONSTRAINT "FK_6b562cdedb0e253a03efe541913" FOREIGN KEY ("signId") REFERENCES "sign"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_signs" ADD CONSTRAINT "FK_9c47f331f791b8df90f7be6aa5d" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lesson_signs" DROP CONSTRAINT "FK_9c47f331f791b8df90f7be6aa5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_signs" DROP CONSTRAINT "FK_6b562cdedb0e253a03efe541913"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_model" DROP CONSTRAINT "FK_f85ced7f8dacffd6050931393bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_recording" DROP CONSTRAINT "FK_98258d6a3ec4bbf05ad25e2833f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_recording" DROP CONSTRAINT "FK_330d0a656e78855619659f64821"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_variant" DROP CONSTRAINT "FK_863b1276fbabe80ad66da412d18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sign_variant" DROP CONSTRAINT "FK_8eaa0246fce0d75799a1aee031b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9c47f331f791b8df90f7be6aa5"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6b562cdedb0e253a03efe54191"`,
    );
    await queryRunner.query(`DROP TABLE "lesson_signs"`);
    await queryRunner.query(`DROP TABLE "lesson_model"`);
    await queryRunner.query(`DROP TABLE "sign"`);
    await queryRunner.query(`DROP TABLE "sign_recording"`);
    await queryRunner.query(`DROP TABLE "sign_variant"`);
  }
}
