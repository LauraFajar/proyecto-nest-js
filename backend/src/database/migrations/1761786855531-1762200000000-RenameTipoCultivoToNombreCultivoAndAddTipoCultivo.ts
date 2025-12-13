import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameTipoCultivoToNombreCultivoAndAddTipoCultivo1761786855531
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE cultivos RENAME COLUMN tipo_cultivo TO nombre_cultivo`,
    );

    await queryRunner.query(
      `ALTER TABLE cultivos ALTER COLUMN nombre_cultivo TYPE VARCHAR(100)`,
    );

    await queryRunner.query(
      `ALTER TABLE cultivos ADD COLUMN tipo_cultivo VARCHAR(20) NOT NULL DEFAULT 'transitorios'`,
    );
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
