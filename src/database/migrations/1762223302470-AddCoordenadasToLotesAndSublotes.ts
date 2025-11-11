import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoordenadasToLotesAndSublotes1762223302470 implements MigrationInterface {
    name = 'AddCoordenadasToLotesAndSublotes1762223302470';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar si el tipo geography existe (PostGIS instalado)
        const check = await queryRunner.query(`SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geography') AS exists`);
        const hasGeography = Array.isArray(check) && (check[0]?.exists === true || check[0]?.exists === 't' || check[0]?.exists === 1);

        const lotesExists = await queryRunner.hasTable('lotes');
        if (lotesExists) {
            const lotesTable = await queryRunner.getTable('lotes');
            const hasCoordenadas = lotesTable?.findColumnByName('coordenadas');
            if (!hasCoordenadas && hasGeography) {
                await queryRunner.query(`ALTER TABLE "lotes" ADD "coordenadas" geography(Polygon,4326)`);
            }
        }
        const sublotesExists = await queryRunner.hasTable('sublotes');
        if (sublotesExists) {
            const sublotesTable = await queryRunner.getTable('sublotes');
            const hasCoordenadasSub = sublotesTable?.findColumnByName('coordenadas');
            if (!hasCoordenadasSub && hasGeography) {
                await queryRunner.query(`ALTER TABLE "sublotes" ADD "coordenadas" geography(Polygon,4326)`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const sublotesExists = await queryRunner.hasTable('sublotes');
        if (sublotesExists) {
            const sublotesTable = await queryRunner.getTable('sublotes');
            const hasCoordenadasSub = sublotesTable?.findColumnByName('coordenadas');
            if (hasCoordenadasSub) {
                await queryRunner.query(`ALTER TABLE "sublotes" DROP COLUMN "coordenadas"`);
            }
        }
        const lotesExists = await queryRunner.hasTable('lotes');
        if (lotesExists) {
            const lotesTable = await queryRunner.getTable('lotes');
            const hasCoordenadas = lotesTable?.findColumnByName('coordenadas');
            if (hasCoordenadas) {
                await queryRunner.query(`ALTER TABLE "lotes" DROP COLUMN "coordenadas"`);
            }
        }
    }

}