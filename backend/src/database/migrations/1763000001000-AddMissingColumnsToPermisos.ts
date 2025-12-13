import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsToPermisos1763000001000
  implements MigrationInterface
{
  name = 'AddMissingColumnsToPermisos1763000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'permisos' AND column_name = 'nombre_permiso'
        ) THEN
          ALTER TABLE "permisos" ADD COLUMN "nombre_permiso" character varying(128) NOT NULL DEFAULT 'desconocido';
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'permisos' AND column_name = 'descripcion'
        ) THEN
          ALTER TABLE "permisos" ADD COLUMN "descripcion" text;
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'permisos' AND column_name = 'activo'
        ) THEN
          ALTER TABLE "permisos" ADD COLUMN "activo" boolean NOT NULL DEFAULT true;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permisos" DROP COLUMN IF EXISTS "activo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permisos" DROP COLUMN IF EXISTS "descripcion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "permisos" DROP COLUMN IF EXISTS "nombre_permiso"`,
    );
  }
}
