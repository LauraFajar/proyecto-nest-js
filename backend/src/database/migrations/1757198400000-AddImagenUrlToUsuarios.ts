import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImagenUrlToUsuarios1757198400000 implements MigrationInterface {
  name = 'AddImagenUrlToUsuarios1757198400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
          ALTER TABLE "usuarios"
          ADD COLUMN IF NOT EXISTS "imagen_url" character varying(255);
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
          ALTER TABLE "usuarios"
          DROP COLUMN IF EXISTS "imagen_url";
        END IF;
      END $$;
    `);
  }
}
