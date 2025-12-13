import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlertaTable1739818800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log(
      'Migración CreateAlertaTable1739818800000 ejecutada como vacía',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
