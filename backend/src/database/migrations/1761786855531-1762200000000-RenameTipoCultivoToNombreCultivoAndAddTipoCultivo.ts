import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTipoCultivoToNombreCultivoAndAddTipoCultivo1761786855531
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
          -- This migration is intended to refactor the 'cultivos' table from an old schema.
          -- It should only run if 'tipo_cultivo' exists and 'nombre_cultivo' does not.
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultivos' AND column_name = 'tipo_cultivo') AND
             NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cultivos' AND column_name = 'nombre_cultivo') THEN

              ALTER TABLE cultivos RENAME COLUMN tipo_cultivo TO nombre_cultivo;
              ALTER TABLE cultivos ALTER COLUMN nombre_cultivo TYPE VARCHAR(100);
              -- Since the original tipo_cultivo was renamed, we can safely add a new one.
              ALTER TABLE cultivos ADD COLUMN tipo_cultivo VARCHAR(20) NOT NULL DEFAULT 'transitorios';
          END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE cultivos DROP COLUMN tipo_cultivo`);

    await queryRunner.query(
      `ALTER TABLE cultivos ALTER COLUMN nombre_cultivo TYPE VARCHAR(20)`,
    );

    await queryRunner.query(
      `ALTER TABLE cultivos RENAME COLUMN nombre_cultivo TO tipo_cultivo`,
    );
  }
}
