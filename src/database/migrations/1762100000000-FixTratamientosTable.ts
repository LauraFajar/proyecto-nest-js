import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTratamientosTable1762100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const tratamientosExists = await queryRunner.hasTable('tratamientos');
        if (tratamientosExists) {
            await queryRunner.query(`
                ALTER TABLE tratamientos
                ALTER COLUMN dosis TYPE TEXT,
                ALTER COLUMN descripcion SET NOT NULL,
                ALTER COLUMN frecuencia SET NOT NULL;
            `);
        }
        const epaExists = await queryRunner.hasTable('epa');
        if (tratamientosExists && epaExists) {
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM information_schema.table_constraints 
                        WHERE constraint_name = 'fk_tratamiento_epa'
                    ) THEN
                        ALTER TABLE tratamientos
                        ADD CONSTRAINT fk_tratamiento_epa
                        FOREIGN KEY (id_epa)
                        REFERENCES epa(id_epa)
                        ON DELETE CASCADE;
                    END IF;
                END
                $$;
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tratamientosExists = await queryRunner.hasTable('tratamientos');
        if (!tratamientosExists) return;
        await queryRunner.query(`
            ALTER TABLE tratamientos
            DROP CONSTRAINT IF EXISTS fk_tratamiento_epa;
        `);
        await queryRunner.query(`
            ALTER TABLE tratamientos
            ALTER COLUMN descripcion DROP NOT NULL,
            ALTER COLUMN frecuencia DROP NOT NULL;
        `);
    }
}