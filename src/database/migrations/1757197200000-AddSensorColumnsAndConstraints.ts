import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSensorColumnsAndConstraints1757197200000 implements MigrationInterface {
    name = 'AddSensorColumnsAndConstraints1757197200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Agregar columnas a sensores
        await queryRunner.query(`
            ALTER TABLE "sensores" 
            ADD COLUMN IF NOT EXISTS "latitud" decimal(10,8),
            ADD COLUMN IF NOT EXISTS "longitud" decimal(11,8),
            ADD COLUMN IF NOT EXISTS "valor_actual" decimal(10,2),
            ADD COLUMN IF NOT EXISTS "valor_minimo" decimal(10,2),
            ADD COLUMN IF NOT EXISTS "valor_maximo" decimal(10,2),
            ADD COLUMN IF NOT EXISTS "ultima_lectura" TIMESTAMP,
            ADD COLUMN IF NOT EXISTS "configuracion" TEXT,
            ADD COLUMN IF NOT EXISTS "historial_lecturas" JSONB
        `);

        // 2. Actualizar restricciones NOT NULL en lotes
        await queryRunner.query(`
            UPDATE "lotes" SET 
                "nombre_lote" = COALESCE("nombre_lote", 'sin_nombre'),
                "descripcion" = COALESCE("descripcion", 'sin_descripcion')
        `);
        
        await queryRunner.query(`
            ALTER TABLE "lotes" 
            ALTER COLUMN "nombre_lote" SET NOT NULL,
            ALTER COLUMN "descripcion" SET NOT NULL
        `);

        // 3. Actualizar restricciones NOT NULL en categorias
        await queryRunner.query(`
            UPDATE "categorias" SET 
                "nombre" = COALESCE("nombre", 'Sin Nombre'),
                "descripcion" = COALESCE("descripcion", 'Sin Descripción')
        `);
        
        await queryRunner.query(`
            ALTER TABLE "categorias" 
            ALTER COLUMN "nombre" SET NOT NULL,
            ALTER COLUMN "descripcion" SET NOT NULL
        `);

        // 4. Actualizar restricciones NOT NULL en almacenes
        await queryRunner.query(`
            UPDATE "almacenes" SET 
                "nombre_almacen" = COALESCE("nombre_almacen", 'sin_nombre'),
                "descripcion" = COALESCE("descripcion", 'sin_descripcion')
        `);
        
        await queryRunner.query(`
            ALTER TABLE "almacenes" 
            ALTER COLUMN "nombre_almacen" SET NOT NULL,
            ALTER COLUMN "descripcion" SET NOT NULL
        `);

        // 5. Actualizar tabla de migraciones
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "migrations" (
                "id" SERIAL PRIMARY KEY,
                "timestamp" bigint NOT NULL,
                "name" character varying NOT NULL
            )
        `);

        // 6. Insertar esta migración en la tabla de migraciones
        await queryRunner.query(`
            INSERT INTO "migrations" ("timestamp", "name") 
            VALUES (1757197200000, 'AddSensorColumnsAndConstraints1757197200000')
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir cambios
        await queryRunner.query(`
            ALTER TABLE "sensores" 
            DROP COLUMN IF EXISTS "latitud",
            DROP COLUMN IF EXISTS "longitud",
            DROP COLUMN IF EXISTS "valor_actual",
            DROP COLUMN IF EXISTS "valor_minimo",
            DROP COLUMN IF EXISTS "valor_maximo",
            DROP COLUMN IF EXISTS "ultima_lectura",
            DROP COLUMN IF EXISTS "configuracion",
            DROP COLUMN IF EXISTS "historial_lecturas"
        `);

        // No revertimos los cambios de NOT NULL ya que podrían afectar datos existentes
        // Se recomienda hacer un respaldo antes de aplicar migraciones
    }
}
