import { MigrationInterface, QueryRunner } from "typeorm";

export class AlignSalidasSchema1764038800000 implements MigrationInterface {
  name = 'AlignSalidasSchema1764038800000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "salidas" ADD COLUMN IF NOT EXISTS "nombre" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "salidas" ADD COLUMN IF NOT EXISTS "codigo" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "salidas" ADD COLUMN IF NOT EXISTS "unidad_medida" varchar(64)`);
    await queryRunner.query(`ALTER TABLE "salidas" ADD COLUMN IF NOT EXISTS "estado" varchar(64) DEFAULT 'completado'`);
    await queryRunner.query(`ALTER TABLE "salidas" ADD COLUMN IF NOT EXISTS "id_insumo" integer`);

    await queryRunner.query(`UPDATE "salidas" SET "estado" = COALESCE("estado", 'completado')`);

    // Set NOT NULL constraints where applicable
    await queryRunner.query(`UPDATE "salidas" SET "nombre" = COALESCE("nombre", 'Salida')`);
    await queryRunner.query(`UPDATE "salidas" SET "codigo" = COALESCE("codigo", 'SAL-001')`);
    await queryRunner.query(`ALTER TABLE "salidas" ALTER COLUMN "nombre" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "salidas" ALTER COLUMN "codigo" SET NOT NULL`);

    await queryRunner.query(`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'FK_salidas_insumo'
      ) THEN
        ALTER TABLE "salidas"
        ADD CONSTRAINT "FK_salidas_insumo" FOREIGN KEY ("id_insumo") REFERENCES "insumos" ("id_insumo") ON DELETE SET NULL;
      END IF;
    END $$;`);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "salidas" DROP CONSTRAINT IF EXISTS "FK_salidas_insumo"`);
    await queryRunner.query(`ALTER TABLE "salidas" DROP COLUMN IF EXISTS "id_insumo"`);
    await queryRunner.query(`ALTER TABLE "salidas" DROP COLUMN IF EXISTS "unidad_medida"`);
    await queryRunner.query(`ALTER TABLE "salidas" DROP COLUMN IF EXISTS "estado"`);
    await queryRunner.query(`ALTER TABLE "salidas" DROP COLUMN IF EXISTS "codigo"`);
    await queryRunner.query(`ALTER TABLE "salidas" DROP COLUMN IF EXISTS "nombre"`);
  }
}
