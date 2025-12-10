import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtToAlertas1765306200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "alertas" 
            ADD COLUMN "created_at" TIMESTAMP DEFAULT now()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alertas" DROP COLUMN "created_at"`);
    }
}
