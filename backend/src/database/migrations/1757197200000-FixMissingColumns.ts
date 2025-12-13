import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMissingColumns1757197200000 implements MigrationInterface {
  name = 'FixMissingColumns1757197200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columnas faltantes a la tabla sensores
    await queryRunner.query(
      `ALTER TABLE "sensores" ADD COLUMN IF NOT EXISTS "latitud" decimal(8,4) DEFAULT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "sensores" ADD COLUMN IF NOT EXISTS "longitud" decimal(8,4) DEFAULT NULL`,
    );

    // Actualizar columnas NOT NULL en lotes
    await queryRunner.query(
      `UPDATE "lotes" SET "nombre_lote" = 'sin_nombre' WHERE "nombre_lote" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "lotes" ALTER COLUMN "nombre_lote" SET NOT NULL`,
    );

    await queryRunner.query(
      `UPDATE "lotes" SET "descripcion" = 'sin_descripcion' WHERE "descripcion" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "lotes" ALTER COLUMN "descripcion" SET NOT NULL`,
    );

    // Actualizar columnas NOT NULL en categorias
    await queryRunner.query(
      `UPDATE "categorias" SET "nombre" = 'Sin Nombre' WHERE "nombre" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "categorias" ALTER COLUMN "nombre" SET NOT NULL`,
    );

    await queryRunner.query(
      `UPDATE "categorias" SET "descripcion" = 'Sin Descripción' WHERE "descripcion" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "categorias" ALTER COLUMN "descripcion" SET NOT NULL`,
    );

    // Actualizar columnas NOT NULL en almacenes
    await queryRunner.query(
      `UPDATE "almacenes" SET "nombre_almacen" = 'sin_nombre' WHERE "nombre_almacen" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "almacenes" ALTER COLUMN "nombre_almacen" SET NOT NULL`,
    );

    await queryRunner.query(
      `UPDATE "almacenes" SET "descripcion" = 'sin_descripcion' WHERE "descripcion" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "almacenes" ALTER COLUMN "descripcion" SET NOT NULL`,
    );

    // Actualizar columnas en usuarios (solo numero_documento que es nullable)
    await queryRunner.query(
      `UPDATE "usuarios" SET "numero_documento" = 'sin_numero' WHERE "numero_documento" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" ALTER COLUMN "numero_documento" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir cambios
    await queryRunner.query(
      `ALTER TABLE "sensores" DROP COLUMN IF EXISTS "longitud"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sensores" DROP COLUMN IF EXISTS "latitud"`,
    );

    // Nota: No es posible revertir completamente los cambios de NOT NULL sin conocer el estado anterior
    // Se dejan las columnas como estaban pero sin la restricción NOT NULL
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
