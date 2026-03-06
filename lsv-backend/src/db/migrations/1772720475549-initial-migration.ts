import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1772720475549 implements MigrationInterface {
  name = 'InitialMigration1772720475549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user_language\` (\`userId\` varchar(255) NOT NULL, \`languageId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`userId\`, \`languageId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`country\` (\`code\` varchar(2) NOT NULL, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`division\` (\`code\` varchar(10) NOT NULL, \`name\` varchar(255) NOT NULL, \`countryCode\` varchar(2) NULL, PRIMARY KEY (\`code\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_region\` (\`userId\` varchar(255) NOT NULL, \`regionId\` varchar(255) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`userId\`, \`regionId\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`region\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`code\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`isDefault\` tinyint NOT NULL DEFAULT 0, \`languageId\` varchar(255) NULL, \`divisionCode\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_8d766fc1d4d2e72ecd5f6567a0\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`language\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`countryCode\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_7df7d1e250ea2a416f078a631f\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`stages\` (\`id\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`languageId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`lesson_variant\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`content\` text NOT NULL, \`isRegionalSpecific\` tinyint NOT NULL DEFAULT 0, \`isBase\` tinyint NOT NULL DEFAULT 0, \`regionalNotes\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`baseLessonId\` varchar(36) NULL, \`regionId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`question_variant\` (\`id\` varchar(36) NOT NULL, \`question\` text NOT NULL, \`quizVariantId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`quiz_variant\` (\`id\` varchar(36) NOT NULL, \`lessonVariantId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`quiz_submission\` (\`id\` varchar(36) NOT NULL, \`answers\` json NULL, \`score\` int NULL, \`submittedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`userId\` varchar(36) NULL, \`quizId\` varchar(36) NULL, \`quizVariantId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`option\` (\`id\` varchar(36) NOT NULL, \`text\` varchar(255) NOT NULL, \`isCorrect\` tinyint NOT NULL DEFAULT 0, \`questionId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`question\` (\`id\` varchar(36) NOT NULL, \`text\` varchar(255) NOT NULL, \`quizId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`quiz\` (\`id\` varchar(36) NOT NULL, \`lessonId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`lesson\` (\`id\` varchar(36) NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`name\` varchar(255) NOT NULL, \`description\` text NOT NULL, \`content\` text NOT NULL, \`languageId\` varchar(36) NULL, \`stageId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user_lesson\` (\`id\` varchar(36) NOT NULL, \`isCompleted\` tinyint NOT NULL DEFAULT 0, \`completedAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`userId\` varchar(36) NULL, \`lessonId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`moderator_permission\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`scope\` enum ('language', 'region') NOT NULL, \`languageId\` varchar(255) NULL, \`regionId\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` varchar(36) NOT NULL, \`email\` varchar(255) NOT NULL, \`googleId\` varchar(255) NULL, \`hashPassword\` varchar(255) NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`age\` int NULL, \`isRightHanded\` tinyint NULL, \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`role\` varchar(255) NOT NULL DEFAULT 'user', UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`option_variant\` (\`id\` varchar(36) NOT NULL, \`text\` text NOT NULL, \`isCorrect\` tinyint NOT NULL DEFAULT 0, \`questionVariantId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_language\` ADD CONSTRAINT \`FK_43d5b919c56d00a9f61ae8bf4cf\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_language\` ADD CONSTRAINT \`FK_ce64abf864b84feda3b2d3d923e\` FOREIGN KEY (\`languageId\`) REFERENCES \`language\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`division\` ADD CONSTRAINT \`FK_29313facd857d6b8cccf158f0cb\` FOREIGN KEY (\`countryCode\`) REFERENCES \`country\`(\`code\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_region\` ADD CONSTRAINT \`FK_f12c3ce8e236bc1fc27743624a8\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_region\` ADD CONSTRAINT \`FK_abd2a126f7462c84fdf781bffd5\` FOREIGN KEY (\`regionId\`) REFERENCES \`region\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`region\` ADD CONSTRAINT \`FK_2f055f12912b6f31425c3e50e51\` FOREIGN KEY (\`languageId\`) REFERENCES \`language\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`region\` ADD CONSTRAINT \`FK_817d2947492c87d602b5d7817d7\` FOREIGN KEY (\`divisionCode\`) REFERENCES \`division\`(\`code\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`language\` ADD CONSTRAINT \`FK_b2140b6891063cc207e55404fcc\` FOREIGN KEY (\`countryCode\`) REFERENCES \`country\`(\`code\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`stages\` ADD CONSTRAINT \`FK_d38605846a4f9dc9e2895fa46ac\` FOREIGN KEY (\`languageId\`) REFERENCES \`language\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`lesson_variant\` ADD CONSTRAINT \`FK_e18aab62ed802e5a1513c750de9\` FOREIGN KEY (\`baseLessonId\`) REFERENCES \`lesson\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`lesson_variant\` ADD CONSTRAINT \`FK_7fc9e13d1ad00c797bbc068b308\` FOREIGN KEY (\`regionId\`) REFERENCES \`region\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_variant\` ADD CONSTRAINT \`FK_dff5d7e4db72fa459b9114a9565\` FOREIGN KEY (\`quizVariantId\`) REFERENCES \`quiz_variant\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz_variant\` ADD CONSTRAINT \`FK_6a9c38d09511f7228e937bf68a8\` FOREIGN KEY (\`lessonVariantId\`) REFERENCES \`lesson_variant\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz_submission\` ADD CONSTRAINT \`FK_611bef6102c491c49be42432c17\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz_submission\` ADD CONSTRAINT \`FK_d80e4bff3be137d3f97a5ac42d7\` FOREIGN KEY (\`quizId\`) REFERENCES \`quiz\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz_submission\` ADD CONSTRAINT \`FK_1f6aae2eee7c2f51912515b6375\` FOREIGN KEY (\`quizVariantId\`) REFERENCES \`quiz_variant\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`option\` ADD CONSTRAINT \`FK_b94517ccffa9c97ebb8eddfcae3\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` ADD CONSTRAINT \`FK_4959a4225f25d923111e54c7cd2\` FOREIGN KEY (\`quizId\`) REFERENCES \`quiz\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz\` ADD CONSTRAINT \`FK_681441d1bf004fc97e473a3bbbb\` FOREIGN KEY (\`lessonId\`) REFERENCES \`lesson\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`lesson\` ADD CONSTRAINT \`FK_d56e101695dc9292af226db76b2\` FOREIGN KEY (\`languageId\`) REFERENCES \`language\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`lesson\` ADD CONSTRAINT \`FK_1d6a48de44611976d77ba73f5d4\` FOREIGN KEY (\`stageId\`) REFERENCES \`stages\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_lesson\` ADD CONSTRAINT \`FK_83cbd2ebf724e51afe91d8205b4\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_lesson\` ADD CONSTRAINT \`FK_bd8e76fd42a02ed386930662662\` FOREIGN KEY (\`lessonId\`) REFERENCES \`lesson\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`moderator_permission\` ADD CONSTRAINT \`FK_80dd8bfd2da29c8eee80c7f2664\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`moderator_permission\` ADD CONSTRAINT \`FK_5e0b02abf86e301079e917eaacc\` FOREIGN KEY (\`languageId\`) REFERENCES \`language\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`moderator_permission\` ADD CONSTRAINT \`FK_bf6ad763ec1301e0952bffc82f7\` FOREIGN KEY (\`regionId\`) REFERENCES \`region\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`option_variant\` ADD CONSTRAINT \`FK_0b53285bf45dee191bbecd52720\` FOREIGN KEY (\`questionVariantId\`) REFERENCES \`question_variant\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`option_variant\` DROP FOREIGN KEY \`FK_0b53285bf45dee191bbecd52720\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`moderator_permission\` DROP FOREIGN KEY \`FK_bf6ad763ec1301e0952bffc82f7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`moderator_permission\` DROP FOREIGN KEY \`FK_5e0b02abf86e301079e917eaacc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`moderator_permission\` DROP FOREIGN KEY \`FK_80dd8bfd2da29c8eee80c7f2664\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_lesson\` DROP FOREIGN KEY \`FK_bd8e76fd42a02ed386930662662\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_lesson\` DROP FOREIGN KEY \`FK_83cbd2ebf724e51afe91d8205b4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`lesson\` DROP FOREIGN KEY \`FK_1d6a48de44611976d77ba73f5d4\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`lesson\` DROP FOREIGN KEY \`FK_d56e101695dc9292af226db76b2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz\` DROP FOREIGN KEY \`FK_681441d1bf004fc97e473a3bbbb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question\` DROP FOREIGN KEY \`FK_4959a4225f25d923111e54c7cd2\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`option\` DROP FOREIGN KEY \`FK_b94517ccffa9c97ebb8eddfcae3\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz_submission\` DROP FOREIGN KEY \`FK_1f6aae2eee7c2f51912515b6375\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz_submission\` DROP FOREIGN KEY \`FK_d80e4bff3be137d3f97a5ac42d7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz_submission\` DROP FOREIGN KEY \`FK_611bef6102c491c49be42432c17\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`quiz_variant\` DROP FOREIGN KEY \`FK_6a9c38d09511f7228e937bf68a8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`question_variant\` DROP FOREIGN KEY \`FK_dff5d7e4db72fa459b9114a9565\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`lesson_variant\` DROP FOREIGN KEY \`FK_7fc9e13d1ad00c797bbc068b308\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`lesson_variant\` DROP FOREIGN KEY \`FK_e18aab62ed802e5a1513c750de9\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`stages\` DROP FOREIGN KEY \`FK_d38605846a4f9dc9e2895fa46ac\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`language\` DROP FOREIGN KEY \`FK_b2140b6891063cc207e55404fcc\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`region\` DROP FOREIGN KEY \`FK_817d2947492c87d602b5d7817d7\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`region\` DROP FOREIGN KEY \`FK_2f055f12912b6f31425c3e50e51\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_region\` DROP FOREIGN KEY \`FK_abd2a126f7462c84fdf781bffd5\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_region\` DROP FOREIGN KEY \`FK_f12c3ce8e236bc1fc27743624a8\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`division\` DROP FOREIGN KEY \`FK_29313facd857d6b8cccf158f0cb\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_language\` DROP FOREIGN KEY \`FK_ce64abf864b84feda3b2d3d923e\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`user_language\` DROP FOREIGN KEY \`FK_43d5b919c56d00a9f61ae8bf4cf\``,
    );
    await queryRunner.query(`DROP TABLE \`option_variant\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``,
    );
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(`DROP TABLE \`moderator_permission\``);
    await queryRunner.query(`DROP TABLE \`user_lesson\``);
    await queryRunner.query(`DROP TABLE \`lesson\``);
    await queryRunner.query(`DROP TABLE \`quiz\``);
    await queryRunner.query(`DROP TABLE \`question\``);
    await queryRunner.query(`DROP TABLE \`option\``);
    await queryRunner.query(`DROP TABLE \`quiz_submission\``);
    await queryRunner.query(`DROP TABLE \`quiz_variant\``);
    await queryRunner.query(`DROP TABLE \`question_variant\``);
    await queryRunner.query(`DROP TABLE \`lesson_variant\``);
    await queryRunner.query(`DROP TABLE \`stages\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_7df7d1e250ea2a416f078a631f\` ON \`language\``,
    );
    await queryRunner.query(`DROP TABLE \`language\``);
    await queryRunner.query(
      `DROP INDEX \`IDX_8d766fc1d4d2e72ecd5f6567a0\` ON \`region\``,
    );
    await queryRunner.query(`DROP TABLE \`region\``);
    await queryRunner.query(`DROP TABLE \`user_region\``);
    await queryRunner.query(`DROP TABLE \`division\``);
    await queryRunner.query(`DROP TABLE \`country\``);
    await queryRunner.query(`DROP TABLE \`user_language\``);
  }
}
