import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLaborCostsToActividades1762642100000 implements MigrationInterface {
  name = 'AddLaborCostsToActividades1762642100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "actividades" ADD COLUMN IF NOT EXISTS "costo_mano_obra" numeric(12,2) DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "actividades" ADD COLUMN IF NOT EXISTS "horas_trabajadas" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "actividades" ADD COLUMN IF NOT EXISTS "tarifa_hora" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "actividades" ADD COLUMN IF NOT EXISTS "costo_maquinaria" numeric(12,2) DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "actividades" DROP COLUMN IF EXISTS "costo_maquinaria"`);
    await queryRunner.query(`ALTER TABLE "actividades" DROP COLUMN IF EXISTS "tarifa_hora"`);
    await queryRunner.query(`ALTER TABLE "actividades" DROP COLUMN IF EXISTS "horas_trabajadas"`);
    await queryRunner.query(`ALTER TABLE "actividades" DROP COLUMN IF EXISTS "costo_mano_obra"`);
  }
}