import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1773939643549 implements MigrationInterface {
  name = 'InitialSchema1773939643549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_language" ("userId" uuid NOT NULL, "languageId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_af83763d8a9fe1919ca7441b7f0" PRIMARY KEY ("userId", "languageId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "country" ("code" character varying(2) NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_8ff4c23dc9a3f3856555bd86186" PRIMARY KEY ("code"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "division" ("code" character varying(10) NOT NULL, "name" character varying NOT NULL, "countryCode" character varying(2), CONSTRAINT "PK_1870649c4e2c6970186e055f3d2" PRIMARY KEY ("code"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_region" ("userId" uuid NOT NULL, "regionId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f5b1f19c490a1e1bc2a9cc6387a" PRIMARY KEY ("userId", "regionId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "region" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "code" character varying NOT NULL, "description" text NOT NULL, "isDefault" boolean NOT NULL DEFAULT false, "languageId" uuid, "divisionCode" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8d766fc1d4d2e72ecd5f6567a02" UNIQUE ("name"), CONSTRAINT "PK_5f48ffc3af96bc486f5f3f3a6da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "language" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text NOT NULL, "countryCode" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_7df7d1e250ea2a416f078a631fb" UNIQUE ("name"), CONSTRAINT "PK_cc0a99e710eb3733f6fb42b1d4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text NOT NULL, "languageId" uuid, CONSTRAINT "PK_16efa0f8f5386328944769b9e6d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lesson_variant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text NOT NULL, "content" text NOT NULL, "isRegionalSpecific" boolean NOT NULL DEFAULT false, "isBase" boolean NOT NULL DEFAULT false, "regionalNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "baseLessonId" uuid, "regionId" uuid, CONSTRAINT "PK_6fbe6cb4eb1aea1296212df0e55" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "question_variant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "quizVariantId" uuid, CONSTRAINT "PK_16149aaecbb01074141eceb8e8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_variant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lessonVariantId" uuid, CONSTRAINT "PK_d2fd1d0f166fde2130abb662279" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_submission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "answers" json, "score" integer, "submittedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "quizId" uuid, "quizVariantId" uuid, CONSTRAINT "PK_af730e984e8f6f25b5667a5d7be" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "option" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" character varying NOT NULL, "isCorrect" boolean NOT NULL DEFAULT false, "questionId" uuid, CONSTRAINT "PK_e6090c1c6ad8962eea97abdbe63" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "question" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" character varying NOT NULL, "quizId" uuid, CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "lessonId" uuid, CONSTRAINT "PK_422d974e7217414e029b3e641d0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "lesson" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" text NOT NULL, "content" text NOT NULL, "languageId" uuid, "stageId" uuid, CONSTRAINT "PK_0ef25918f0237e68696dee455bd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_lesson" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isCompleted" boolean NOT NULL DEFAULT false, "completedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "lessonId" uuid, CONSTRAINT "PK_1c2bd4db4d9d64a1c9ec184b13c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."moderator_permission_scope_enum" AS ENUM('language', 'region')`,
    );
    await queryRunner.query(
      `CREATE TABLE "moderator_permission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "scope" "public"."moderator_permission_scope_enum" NOT NULL, "languageId" uuid, "regionId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_05c6422167348f5eff378e5cfca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "googleId" character varying, "hashPassword" character varying, "firstName" character varying NOT NULL, "lastName" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "age" integer, "isRightHanded" boolean, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "role" character varying NOT NULL DEFAULT 'user', CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "option_variant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "isCorrect" boolean NOT NULL DEFAULT false, "questionVariantId" uuid, CONSTRAINT "PK_e61c436f970f9ab190da19fc91f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_language" ADD CONSTRAINT "FK_43d5b919c56d00a9f61ae8bf4cf" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_language" ADD CONSTRAINT "FK_ce64abf864b84feda3b2d3d923e" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" ADD CONSTRAINT "FK_29313facd857d6b8cccf158f0cb" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_region" ADD CONSTRAINT "FK_f12c3ce8e236bc1fc27743624a8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_region" ADD CONSTRAINT "FK_abd2a126f7462c84fdf781bffd5" FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "region" ADD CONSTRAINT "FK_2f055f12912b6f31425c3e50e51" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "region" ADD CONSTRAINT "FK_817d2947492c87d602b5d7817d7" FOREIGN KEY ("divisionCode") REFERENCES "division"("code") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "language" ADD CONSTRAINT "FK_b2140b6891063cc207e55404fcc" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stages" ADD CONSTRAINT "FK_d38605846a4f9dc9e2895fa46ac" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_variant" ADD CONSTRAINT "FK_e18aab62ed802e5a1513c750de9" FOREIGN KEY ("baseLessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_variant" ADD CONSTRAINT "FK_7fc9e13d1ad00c797bbc068b308" FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_variant" ADD CONSTRAINT "FK_dff5d7e4db72fa459b9114a9565" FOREIGN KEY ("quizVariantId") REFERENCES "quiz_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_variant" ADD CONSTRAINT "FK_6a9c38d09511f7228e937bf68a8" FOREIGN KEY ("lessonVariantId") REFERENCES "lesson_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submission" ADD CONSTRAINT "FK_611bef6102c491c49be42432c17" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submission" ADD CONSTRAINT "FK_d80e4bff3be137d3f97a5ac42d7" FOREIGN KEY ("quizId") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submission" ADD CONSTRAINT "FK_1f6aae2eee7c2f51912515b6375" FOREIGN KEY ("quizVariantId") REFERENCES "quiz_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "option" ADD CONSTRAINT "FK_b94517ccffa9c97ebb8eddfcae3" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "question" ADD CONSTRAINT "FK_4959a4225f25d923111e54c7cd2" FOREIGN KEY ("quizId") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz" ADD CONSTRAINT "FK_681441d1bf004fc97e473a3bbbb" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson" ADD CONSTRAINT "FK_d56e101695dc9292af226db76b2" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson" ADD CONSTRAINT "FK_1d6a48de44611976d77ba73f5d4" FOREIGN KEY ("stageId") REFERENCES "stages"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_lesson" ADD CONSTRAINT "FK_83cbd2ebf724e51afe91d8205b4" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_lesson" ADD CONSTRAINT "FK_bd8e76fd42a02ed386930662662" FOREIGN KEY ("lessonId") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "moderator_permission" ADD CONSTRAINT "FK_80dd8bfd2da29c8eee80c7f2664" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "moderator_permission" ADD CONSTRAINT "FK_5e0b02abf86e301079e917eaacc" FOREIGN KEY ("languageId") REFERENCES "language"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "moderator_permission" ADD CONSTRAINT "FK_bf6ad763ec1301e0952bffc82f7" FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "option_variant" ADD CONSTRAINT "FK_0b53285bf45dee191bbecd52720" FOREIGN KEY ("questionVariantId") REFERENCES "question_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "option_variant" DROP CONSTRAINT "FK_0b53285bf45dee191bbecd52720"`,
    );
    await queryRunner.query(
      `ALTER TABLE "moderator_permission" DROP CONSTRAINT "FK_bf6ad763ec1301e0952bffc82f7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "moderator_permission" DROP CONSTRAINT "FK_5e0b02abf86e301079e917eaacc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "moderator_permission" DROP CONSTRAINT "FK_80dd8bfd2da29c8eee80c7f2664"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_lesson" DROP CONSTRAINT "FK_bd8e76fd42a02ed386930662662"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_lesson" DROP CONSTRAINT "FK_83cbd2ebf724e51afe91d8205b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson" DROP CONSTRAINT "FK_1d6a48de44611976d77ba73f5d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson" DROP CONSTRAINT "FK_d56e101695dc9292af226db76b2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz" DROP CONSTRAINT "FK_681441d1bf004fc97e473a3bbbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question" DROP CONSTRAINT "FK_4959a4225f25d923111e54c7cd2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "option" DROP CONSTRAINT "FK_b94517ccffa9c97ebb8eddfcae3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submission" DROP CONSTRAINT "FK_1f6aae2eee7c2f51912515b6375"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submission" DROP CONSTRAINT "FK_d80e4bff3be137d3f97a5ac42d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_submission" DROP CONSTRAINT "FK_611bef6102c491c49be42432c17"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_variant" DROP CONSTRAINT "FK_6a9c38d09511f7228e937bf68a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question_variant" DROP CONSTRAINT "FK_dff5d7e4db72fa459b9114a9565"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_variant" DROP CONSTRAINT "FK_7fc9e13d1ad00c797bbc068b308"`,
    );
    await queryRunner.query(
      `ALTER TABLE "lesson_variant" DROP CONSTRAINT "FK_e18aab62ed802e5a1513c750de9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stages" DROP CONSTRAINT "FK_d38605846a4f9dc9e2895fa46ac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "language" DROP CONSTRAINT "FK_b2140b6891063cc207e55404fcc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "region" DROP CONSTRAINT "FK_817d2947492c87d602b5d7817d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "region" DROP CONSTRAINT "FK_2f055f12912b6f31425c3e50e51"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_region" DROP CONSTRAINT "FK_abd2a126f7462c84fdf781bffd5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_region" DROP CONSTRAINT "FK_f12c3ce8e236bc1fc27743624a8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "division" DROP CONSTRAINT "FK_29313facd857d6b8cccf158f0cb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_language" DROP CONSTRAINT "FK_ce64abf864b84feda3b2d3d923e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_language" DROP CONSTRAINT "FK_43d5b919c56d00a9f61ae8bf4cf"`,
    );
    await queryRunner.query(`DROP TABLE "option_variant"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "moderator_permission"`);
    await queryRunner.query(
      `DROP TYPE "public"."moderator_permission_scope_enum"`,
    );
    await queryRunner.query(`DROP TABLE "user_lesson"`);
    await queryRunner.query(`DROP TABLE "lesson"`);
    await queryRunner.query(`DROP TABLE "quiz"`);
    await queryRunner.query(`DROP TABLE "question"`);
    await queryRunner.query(`DROP TABLE "option"`);
    await queryRunner.query(`DROP TABLE "quiz_submission"`);
    await queryRunner.query(`DROP TABLE "quiz_variant"`);
    await queryRunner.query(`DROP TABLE "question_variant"`);
    await queryRunner.query(`DROP TABLE "lesson_variant"`);
    await queryRunner.query(`DROP TABLE "stages"`);
    await queryRunner.query(`DROP TABLE "language"`);
    await queryRunner.query(`DROP TABLE "region"`);
    await queryRunner.query(`DROP TABLE "user_region"`);
    await queryRunner.query(`DROP TABLE "division"`);
    await queryRunner.query(`DROP TABLE "country"`);
    await queryRunner.query(`DROP TABLE "user_language"`);
  }
}
