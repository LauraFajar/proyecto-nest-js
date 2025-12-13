import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdCultivoToActividades1763663000000
  implements MigrationInterface
{
  name = 'AddIdCultivoToActividades1763663000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'actividades' AND column_name = 'id_cultivo'
        ) THEN
          ALTER TABLE "actividades" ADD COLUMN "id_cultivo" integer;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'actividades' AND column_name = 'cultivoId'
        ) THEN
          UPDATE "actividades" SET "id_cultivo" = "cultivoId" WHERE "id_cultivo" IS NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_actividades_cultivo'
        ) THEN
          ALTER TABLE "actividades"
          ADD CONSTRAINT "FK_actividades_cultivo"
          FOREIGN KEY ("id_cultivo")
          REFERENCES "cultivos"("id_cultivo")
          ON DELETE CASCADE
          ON UPDATE NO ACTION;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'actividades' AND column_name = 'cultivoId'
        ) THEN
          ALTER TABLE "actividades" DROP COLUMN IF EXISTS "cultivoId";
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "actividades" DROP CONSTRAINT IF EXISTS "FK_actividades_cultivo";
    `);
  }
}
