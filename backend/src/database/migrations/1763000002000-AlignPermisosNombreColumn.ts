import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignPermisosNombreColumn1763000002000
  implements MigrationInterface
{
  name = 'AlignPermisosNombreColumn1763000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'permisos' AND column_name = 'nombre'
        ) THEN
          UPDATE "permisos" SET "nombre_permiso" = COALESCE("nombre_permiso", "nombre");
          ALTER TABLE "permisos" DROP COLUMN "nombre";
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'permisos' AND column_name = 'nombre'
        ) THEN
          ALTER TABLE "permisos" ADD COLUMN "nombre" character varying(128);
        END IF;
      END$$;
    `);
  }
}
