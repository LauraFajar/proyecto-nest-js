import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubloteIdToSensores1757197340000 implements MigrationInterface {
    name = 'AddSubloteIdToSensores1757197340000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "sensores"
            ADD COLUMN IF NOT EXISTS "id_sublote" integer
        `);

        await queryRunner.query(`
            ALTER TABLE "sensores"
            ADD CONSTRAINT IF NOT EXISTS "FK_sensores_sublotes"
            FOREIGN KEY ("id_sublote")
            REFERENCES "sublotes"("id_sublote")
        `);

        await queryRunner.query(`
            INSERT INTO "migrations" ("timestamp", "name")
            VALUES (1757197340000, 'AddSubloteIdToSensores1757197340000')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "sensores"
            DROP CONSTRAINT IF EXISTS "FK_sensores_sublotes"
        `);

        await queryRunner.query(`
            ALTER TABLE "sensores"
            DROP COLUMN IF EXISTS "id_sublote"
        `);

        await queryRunner.query(`
            DELETE FROM "migrations"
            WHERE "timestamp" = 1757197340000
        `);
    }
}
