import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCultivoToSensores1764452160000 implements MigrationInterface {
  name = 'AddCultivoToSensores1764452160000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sensores" ADD COLUMN "cultivo_id" integer`);
    await queryRunner.query(
      `ALTER TABLE "sensores" ADD CONSTRAINT "FK_cultivo_sensor" FOREIGN KEY ("cultivo_id") REFERENCES "cultivos"("id_cultivo") ON DELETE SET NULL ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sensores" DROP CONSTRAINT "FK_cultivo_sensor"`);
    await queryRunner.query(`ALTER TABLE "sensores" DROP COLUMN "cultivo_id"`);
  }
}
