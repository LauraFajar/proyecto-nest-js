import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSensorEstadoConstraint1764100000000 implements MigrationInterface {
    name = 'FixSensorEstadoConstraint1764100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Eliminar el constraint existente si existe
        await queryRunner.query(`
            ALTER TABLE "sensores" 
            DROP CONSTRAINT IF EXISTS "sensores_estado_check"
        `);

        // 2. Actualizar valores existentes ANTES de crear el nuevo constraint
        await queryRunner.query(`
            UPDATE "sensores" 
            SET estado = CASE 
                WHEN estado IN ('active', 'enabled', 'on', 'true', '1') THEN 'active'
                WHEN estado IN ('inactive', 'disabled', 'off', 'false', '0') THEN 'inactive'
                WHEN estado IN ('activo', 'habilitado', 'encendido') THEN 'activo'
                WHEN estado IN ('inactivo', 'deshabilitado', 'apagado') THEN 'inactivo'
                WHEN estado IN ('maintenance', 'mantenimiento', 'repair') THEN 'maintenance'
                WHEN estado IN ('error', 'fault', 'fallo', 'fallo') THEN 'error'
                ELSE 'activo'
            END
        `);

        // 3. Crear nuevo constraint que permita 'activo', 'inactivo', 'active', 'inactive'
        await queryRunner.query(`
            ALTER TABLE "sensores" 
            ADD CONSTRAINT "sensores_estado_check" 
            CHECK (estado IN ('activo', 'inactivo', 'active', 'inactive', 'maintenance', 'error'))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "sensores" 
            DROP CONSTRAINT IF EXISTS "sensores_estado_check"
        `);

        await queryRunner.query(`
            ALTER TABLE "sensores" 
            ADD CONSTRAINT "sensores_estado_check" 
            CHECK (estado IN ('active', 'inactive'))
        `);

        // Actualizar valores 'activo'/'inactivo' a 'active'/'inactive'
        await queryRunner.query(`
            UPDATE "sensores" 
            SET estado = CASE 
                WHEN estado = 'activo' THEN 'active'
                WHEN estado = 'inactivo' THEN 'inactive'
                ELSE 'active'
            END
        `);
    }
}
