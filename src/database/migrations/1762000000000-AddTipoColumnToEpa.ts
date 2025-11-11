import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTipoColumnToEpa1762000000000 implements MigrationInterface {
    name = 'AddTipoColumnToEpa1762000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        const epaExists = await queryRunner.hasTable("epa");
        if (!epaExists) return;
        const table = await queryRunner.getTable("epa");
        const tipoColumn = table?.findColumnByName("tipo");
        
        if (!tipoColumn) {
            await queryRunner.query(`
                ALTER TABLE "epa" 
                ADD COLUMN "tipo" VARCHAR(255) DEFAULT 'enfermedad' NOT NULL
            `);
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'epa_tipo_enum') THEN
                        CREATE TYPE epa_tipo_enum AS ENUM ('enfermedad', 'plaga', 'arvense');
                    END IF;
                END
                $$;
            `);
            await queryRunner.query(`
                ALTER TABLE "epa" 
                ALTER COLUMN "tipo" TYPE epa_tipo_enum 
                USING tipo::epa_tipo_enum
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const epaExists = await queryRunner.hasTable("epa");
        if (!epaExists) return;
        const table = await queryRunner.getTable("epa");
        const tipoColumn = table?.findColumnByName("tipo");
        
        if (tipoColumn) {
            await queryRunner.query(`ALTER TABLE "epa" DROP COLUMN "tipo"`);
        }
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'epa_tipo_enum') THEN
                    DROP TYPE epa_tipo_enum;
                END IF;
            END
            $$;
        `);
    }
}