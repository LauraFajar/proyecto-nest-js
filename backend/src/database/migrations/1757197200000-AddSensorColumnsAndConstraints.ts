import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSensorColumnsAndConstraints1757197200000
  implements MigrationInterface
{
  name = 'AddSensorColumnsAndConstraints1757197200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columnas a sensores
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sensores') THEN
          ALTER TABLE "sensores" 
          ADD COLUMN IF NOT EXISTS "valor_actual" decimal(10,2),
          ADD COLUMN IF NOT EXISTS "valor_minimo" decimal(10,2),
          ADD COLUMN IF NOT EXISTS "valor_maximo" decimal(10,2),
          ADD COLUMN IF NOT EXISTS "ultima_lectura" TIMESTAMP,
          ADD COLUMN IF NOT EXISTS "configuracion" TEXT,
          ADD COLUMN IF NOT EXISTS "historial_lecturas" JSONB;
        END IF;
      END $$;
    `);

    // 2. Actualizar restricciones NOT NULL en lotes
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lotes') THEN
          UPDATE "lotes" SET 
              "nombre_lote" = COALESCE("nombre_lote", 'sin_nombre'),
              "descripcion" = COALESCE("descripcion", 'sin_descripcion');
          ALTER TABLE "lotes" 
          ALTER COLUMN "nombre_lote" SET NOT NULL,
          ALTER COLUMN "descripcion" SET NOT NULL;
        END IF;
      END $$;
    `);

    // 3. Actualizar restricciones NOT NULL en categorias
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categorias') THEN
          UPDATE "categorias" SET 
              "nombre" = COALESCE("nombre", 'Sin Nombre'),
              "descripcion" = COALESCE("descripcion", 'Sin Descripción');
          ALTER TABLE "categorias" 
          ALTER COLUMN "nombre" SET NOT NULL,
          ALTER COLUMN "descripcion" SET NOT NULL;
        END IF;
      END $$;
    `);

    // 4. Actualizar restricciones NOT NULL en almacenes
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'almacenes') THEN
          UPDATE "almacenes" SET 
              "nombre_almacen" = COALESCE("nombre_almacen", 'sin_nombre'),
              "descripcion" = COALESCE("descripcion", 'sin_descripcion');
          ALTER TABLE "almacenes" 
          ALTER COLUMN "nombre_almacen" SET NOT NULL,
          ALTER COLUMN "descripcion" SET NOT NULL;
        END IF;
      END $$;
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
      DO $ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sensores') THEN
          ALTER TABLE "sensores" 
          DROP COLUMN IF EXISTS "valor_actual",
          DROP COLUMN IF EXISTS "valor_minimo",
          DROP COLUMN IF EXISTS "valor_maximo",
          DROP COLUMN IF NOT EXISTS "ultima_lectura",
          DROP COLUMN IF NOT EXISTS "configuracion",
          DROP COLUMN IF NOT EXISTS "historial_lecturas";
        END IF;
      END $;
    `);

    await queryRunner.query(`
      DO $ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lotes') THEN
          ALTER TABLE "lotes" ALTER COLUMN "nombre_lote" DROP NOT NULL;
          ALTER TABLE "lotes" ALTER COLUMN "descripcion" DROP NOT NULL;
        END IF;
      END $;
    `);

    await queryRunner.query(`
      DO $ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categorias') THEN
          ALTER TABLE "categorias" ALTER COLUMN "nombre" DROP NOT NULL;
          ALTER TABLE "categorias" ALTER COLUMN "descripcion" DROP NOT NULL;
        END IF;
      END $;
    `);

    await queryRunner.query(`
      DO $ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'almacenes') THEN
          ALTER TABLE "almacenes" ALTER COLUMN "nombre_almacen" DROP NOT NULL;
          ALTER TABLE "almacenes" ALTER COLUMN "descripcion" DROP NOT NULL;
        END IF;
      END $;
    `);
  }
}
