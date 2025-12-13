import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCultivoRelationsToIngresosSalidas1731410000000 implements MigrationInterface {
  name = 'AddCultivoRelationsToIngresosSalidas1731410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "ingresos" ADD COLUMN IF NOT EXISTS "id_cultivo" integer`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_ingresos_cultivo'
        ) THEN
          ALTER TABLE "ingresos"
          ADD CONSTRAINT "FK_ingresos_cultivo"
          FOREIGN KEY ("id_cultivo")
          REFERENCES "cultivos"("id_cultivo")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`ALTER TABLE "salidas" ADD COLUMN IF NOT EXISTS "id_cultivo" integer`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_salidas_cultivo'
        ) THEN
          ALTER TABLE "salidas"
          ADD CONSTRAINT "FK_salidas_cultivo"
          FOREIGN KEY ("id_cultivo")
          REFERENCES "cultivos"("id_cultivo")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "ingresos"
      DROP CONSTRAINT IF EXISTS "FK_ingresos_cultivo";
    `);
    await queryRunner.query(`ALTER TABLE "ingresos" DROP COLUMN IF EXISTS "id_cultivo"`);

    await queryRunner.query(`
      ALTER TABLE "salidas"
      DROP CONSTRAINT IF EXISTS "FK_salidas_cultivo";
    `);
    await queryRunner.query(`ALTER TABLE "salidas" DROP COLUMN IF EXISTS "id_cultivo"`);
  }
}