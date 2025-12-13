import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHttpsFieldsToSensores1762300000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sensores"
      ADD COLUMN IF NOT EXISTS "https_url" character varying,
      ADD COLUMN IF NOT EXISTS "https_method" character varying,
      ADD COLUMN IF NOT EXISTS "https_headers" text,
      ADD COLUMN IF NOT EXISTS "https_enabled" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "https_auth_token" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sensores"
      DROP COLUMN IF EXISTS "https_auth_token",
      DROP COLUMN IF EXISTS "https_enabled",
      DROP COLUMN IF EXISTS "https_headers",
      DROP COLUMN IF EXISTS "https_method",
      DROP COLUMN IF EXISTS "https_url"
    `);
  }
}