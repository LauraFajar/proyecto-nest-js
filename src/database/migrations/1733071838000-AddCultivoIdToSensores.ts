import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCultivoIdToSensores1733071838000 implements MigrationInterface {
    name = 'AddCultivoIdToSensores1733071838000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensores" ADD "cultivo_id" integer`);
        await queryRunner.query(`ALTER TABLE "sensores" ADD CONSTRAINT "FK_sensores_cultivo" FOREIGN KEY ("cultivo_id") REFERENCES "cultivos"("id_cultivo") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sensores" DROP CONSTRAINT "FK_sensores_cultivo"`);
        await queryRunner.query(`ALTER TABLE "sensores" DROP COLUMN "cultivo_id"`);
    }

}