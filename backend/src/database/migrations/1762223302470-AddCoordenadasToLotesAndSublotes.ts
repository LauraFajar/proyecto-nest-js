import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoordenadasToLotesAndSublotes1762223302470
  implements MigrationInterface
{
  name = 'AddCoordenadasToLotesAndSublotes1762223302470';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lotes" ADD COLUMN IF NOT EXISTS "coordenadas" geography(Polygon,4326)`,
    );
    await queryRunner.query(
      `ALTER TABLE "sublotes" ADD COLUMN IF NOT EXISTS "coordenadas" geography(Polygon,4326)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "sublotes" DROP COLUMN "coordenadas"`);
    await queryRunner.query(`ALTER TABLE "lotes" DROP COLUMN "coordenadas"`);
  }
}
