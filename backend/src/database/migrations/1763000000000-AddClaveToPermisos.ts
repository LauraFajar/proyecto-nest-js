import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClaveToPermisos1763000000000 implements MigrationInterface {
  name = 'AddClaveToPermisos1763000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna 'clave' si no existe
    await queryRunner.query(`
      ALTER TABLE "permisos"
      ADD COLUMN IF NOT EXISTS "clave" character varying(64)
    `);

    await queryRunner.query(`
      UPDATE "permisos"
      SET "clave" = COALESCE("clave", CONCAT('permiso:', "id_permiso"::text))
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'UQ_permisos_clave'
        ) THEN
          ALTER TABLE "permisos"
          ADD CONSTRAINT "UQ_permisos_clave" UNIQUE ("clave");
        END IF;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permisos" DROP CONSTRAINT IF EXISTS "UQ_permisos_clave"
    `);
    await queryRunner.query(`
      ALTER TABLE "permisos" DROP COLUMN IF EXISTS "clave"
    `);
  }
}
