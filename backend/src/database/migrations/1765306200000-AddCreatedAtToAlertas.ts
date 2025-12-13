import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedAtToAlertas1765306200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const tableExists = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'alertas' 
            AND column_name = 'created_at'
        `);
        
        if (tableExists.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "alertas" 
                ADD COLUMN "created_at" TIMESTAMP DEFAULT now()
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "alertas" DROP COLUMN "created_at"`);
    }
}
