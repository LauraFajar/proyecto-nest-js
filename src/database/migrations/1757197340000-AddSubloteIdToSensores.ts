import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubloteIdToSensores1757197340000 implements MigrationInterface {
    name = 'AddSubloteIdToSensores1757197340000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "sensores"
            ADD COLUMN IF NOT EXISTS "id_sublote" integer
        `);

        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.table_constraints
                    WHERE table_name = 'sensores'
                    AND constraint_name = 'FK_sensores_sublotes'
                ) THEN
                    ALTER TABLE "sensores"
                    ADD CONSTRAINT "FK_sensores_sublotes"
                    FOREIGN KEY ("id_sublote")
                    REFERENCES "sublotes"("id_sublote");
                END IF;
            END;
            $$;
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
    }
}
