import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCultivoRelationsToIngresosSalidas1731410000000
  implements MigrationInterface
{
  name = 'AddCultivoRelationsToIngresosSalidas1731410000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ingresos') THEN
          ALTER TABLE "ingresos" ADD COLUMN IF NOT EXISTS "id_cultivo" integer;
        END IF;
      END $$;
    `);
    
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ingresos') AND
           NOT EXISTS (
             SELECT 1 FROM pg_constraint WHERE conname = 'FK_21da371f25714e9fa76de26a1ea'
           ) THEN
          ALTER TABLE "ingresos"
          ADD CONSTRAINT "FK_21da371f25714e9fa76de26a1ea"
          FOREIGN KEY ("id_cultivo")
          REFERENCES "cultivos"("id_cultivo")
          ON DELETE SET NULL
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salidas') THEN
          ALTER TABLE "salidas" ADD COLUMN IF NOT EXISTS "id_cultivo" integer;
        END IF;
      END $$;
    `);
    
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salidas') AND
           NOT EXISTS (
             SELECT 1 FROM pg_constraint WHERE conname = 'FK_75486bb253621d3c90ccf6b862d'
           ) THEN
          ALTER TABLE "salidas"
          ADD CONSTRAINT "FK_75486bb253621d3c90ccf6b862d"
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
      DROP CONSTRAINT IF EXISTS "FK_21da371f25714e9fa76de26a1ea";
    `);
    await queryRunner.query(
      `ALTER TABLE "ingresos" DROP COLUMN IF EXISTS "id_cultivo"`,
    );

    await queryRunner.query(`
      ALTER TABLE "salidas"
      DROP CONSTRAINT IF EXISTS "FK_75486bb253621d3c90ccf6b862d";
    `);
    await queryRunner.query(
      `ALTER TABLE "salidas" DROP COLUMN IF EXISTS "id_cultivo"`,
    );
  }
}
