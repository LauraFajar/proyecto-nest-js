import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImagenUrlToUsuarios1757198400000 implements MigrationInterface {
  name = 'AddImagenUrlToUsuarios1757198400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "usuarios"
            ADD COLUMN IF NOT EXISTS "imagen_url" character varying(255)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "usuarios"
            DROP COLUMN IF EXISTS "imagen_url"
        `);
  }
}
