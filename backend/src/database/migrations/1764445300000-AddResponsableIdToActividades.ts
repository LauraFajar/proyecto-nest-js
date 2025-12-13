import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddResponsableIdToActividades1764445300000
  implements MigrationInterface
{
  name = 'AddResponsableIdToActividades1764445300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actividades" ADD COLUMN IF NOT EXISTS "responsable_id" integer`,
    );
    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'actividades' AND constraint_name = 'FK_actividades_responsable'
      ) THEN
        ALTER TABLE "actividades"
        ADD CONSTRAINT "FK_actividades_responsable" FOREIGN KEY ("responsable_id") REFERENCES "usuarios" ("id_usuarios") ON DELETE SET NULL;
      END IF;
    END $$;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actividades" DROP CONSTRAINT IF EXISTS "FK_actividades_responsable"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades" DROP COLUMN IF EXISTS "responsable_id"`,
    );
  }
}
