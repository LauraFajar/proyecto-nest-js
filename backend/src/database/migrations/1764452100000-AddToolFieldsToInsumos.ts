import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddToolFieldsToInsumos1764452100000 implements MigrationInterface {
  name = 'AddToolFieldsToInsumos1764452100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "insumos" ADD COLUMN IF NOT EXISTS "es_herramienta" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "insumos" ADD COLUMN IF NOT EXISTS "costo_compra" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insumos" ADD COLUMN IF NOT EXISTS "vida_util_horas" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insumos" ADD COLUMN IF NOT EXISTS "depreciacion_por_hora" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "insumos" ADD COLUMN IF NOT EXISTS "depreciacion_acumulada" numeric(12,2) DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "insumos" ADD COLUMN IF NOT EXISTS "fecha_compra" date`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "insumos" DROP COLUMN IF EXISTS "fecha_compra"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insumos" DROP COLUMN IF EXISTS "depreciacion_acumulada"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insumos" DROP COLUMN IF EXISTS "depreciacion_por_hora"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insumos" DROP COLUMN IF EXISTS "vida_util_horas"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insumos" DROP COLUMN IF EXISTS "costo_compra"`,
    );
    await queryRunner.query(
      `ALTER TABLE "insumos" DROP COLUMN IF EXISTS "es_herramienta"`,
    );
  }
}
