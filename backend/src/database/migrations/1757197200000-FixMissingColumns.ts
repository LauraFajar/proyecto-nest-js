import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMissingColumns1757197200000 implements MigrationInterface {
  name = 'FixMissingColumns1757197200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sensores') THEN
          ALTER TABLE "sensores" ADD COLUMN IF NOT EXISTS "latitud" decimal(8,4) DEFAULT NULL;
          ALTER TABLE "sensores" ADD COLUMN IF NOT EXISTS "longitud" decimal(8,4) DEFAULT NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lotes') THEN
          UPDATE "lotes" SET "nombre_lote" = 'sin_nombre' WHERE "nombre_lote" IS NULL;
          ALTER TABLE "lotes" ALTER COLUMN "nombre_lote" SET NOT NULL;
          UPDATE "lotes" SET "descripcion" = 'sin_descripcion' WHERE "descripcion" IS NULL;
          ALTER TABLE "lotes" ALTER COLUMN "descripcion" SET NOT NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categorias') THEN
          UPDATE "categorias" SET "nombre" = 'Sin Nombre' WHERE "nombre" IS NULL;
          ALTER TABLE "categorias" ALTER COLUMN "nombre" SET NOT NULL;
          UPDATE "categorias" SET "descripcion" = 'Sin Descripción' WHERE "descripcion" IS NULL;
          ALTER TABLE "categorias" ALTER COLUMN "descripcion" SET NOT NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'almacenes') THEN
          UPDATE "almacenes" SET "nombre_almacen" = 'sin_nombre' WHERE "nombre_almacen" IS NULL;
          ALTER TABLE "almacenes" ALTER COLUMN "nombre_almacen" SET NOT NULL;
          UPDATE "almacenes" SET "descripcion" = 'sin_descripcion' WHERE "descripcion" IS NULL;
          ALTER TABLE "almacenes" ALTER COLUMN "descripcion" SET NOT NULL;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
          UPDATE "usuarios" SET "numero_documento" = 'sin_numero' WHERE "numero_documento" IS NULL;
          ALTER TABLE "usuarios" ALTER COLUMN "numero_documento" SET NOT NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir cambios
    await queryRunner.query(
      `ALTER TABLE "sensores" DROP COLUMN IF EXISTS "longitud"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sensores" DROP COLUMN IF EXISTS "latitud"`,
    );

    await queryRunner.query(
      `ALTER TABLE "lotes" ALTER COLUMN "nombre_lote" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "lotes" ALTER COLUMN "descripcion" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "categorias" ALTER COLUMN "nombre" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "categorias" ALTER COLUMN "descripcion" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "almacenes" ALTER COLUMN "nombre_almacen" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "almacenes" ALTER COLUMN "descripcion" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ALTER COLUMN "numero_documento" DROP NOT NULL`,
    );
  }
}
