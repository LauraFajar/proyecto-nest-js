import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendUtilizaWithUsage1764452150000 implements MigrationInterface {
  name = 'ExtendUtilizaWithUsage1764452150000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "utiliza" ADD COLUMN IF NOT EXISTS "cantidad" numeric(12,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "utiliza" ADD COLUMN IF NOT EXISTS "horas_uso" numeric(10,2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "utiliza" ADD COLUMN IF NOT EXISTS "costo_unitario" numeric(12,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "utiliza" DROP COLUMN IF EXISTS "costo_unitario"`,
    );
    await queryRunner.query(
      `ALTER TABLE "utiliza" DROP COLUMN IF EXISTS "horas_uso"`,
    );
    await queryRunner.query(
      `ALTER TABLE "utiliza" DROP COLUMN IF EXISTS "cantidad"`,
    );
  }
}
