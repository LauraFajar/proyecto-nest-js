import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlertasTableCompleta1761100000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('alertas');

    if (!tableExists) {
      await queryRunner.query(`
                CREATE TABLE "alertas" (
                    "id_alerta" SERIAL NOT NULL,
                    "tipo_alerta" character varying NOT NULL,
                    "descripcion" character varying NOT NULL,
                    "fecha" date NOT NULL,
                    "hora" time NOT NULL,
                    "leida" boolean NOT NULL DEFAULT false,
                    "enviada_email" boolean NOT NULL DEFAULT false,
                    "datos_adicionales" json,
                    "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                    "id_sensor" integer,
                    "id_usuario" integer,
                    CONSTRAINT "PK_alertas" PRIMARY KEY ("id_alerta")
                )
            `);

      await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_alertas_id_sensor" ON "alertas" ("id_sensor")
            `);

      await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_alertas_id_usuario" ON "alertas" ("id_usuario")
            `);

      console.log('Tabla alertas creada con éxito');
    } else {
      console.log('La tabla alertas ya existe, verificando columnas...');

      const hasIdUsuario = await queryRunner.hasColumn('alertas', 'id_usuario');
      if (!hasIdUsuario) {
        await queryRunner.query(`
                    ALTER TABLE "alertas" ADD COLUMN "id_usuario" integer
                `);
        console.log('Columna id_usuario añadida');
      }

      const hasIdSensor = await queryRunner.hasColumn('alertas', 'id_sensor');
      if (!hasIdSensor) {
        await queryRunner.query(`
                    ALTER TABLE "alertas" ADD COLUMN "id_sensor" integer
                `);
        console.log('Columna id_sensor añadida');
      }

      try {
        await queryRunner.query(`
                    CREATE INDEX IF NOT EXISTS "IDX_alertas_id_sensor" ON "alertas" ("id_sensor")
                `);

        await queryRunner.query(`
                    CREATE INDEX IF NOT EXISTS "IDX_alertas_id_usuario" ON "alertas" ("id_usuario")
                `);

        console.log('Índices verificados/creados');
      } catch (error) {
        console.log('Error al crear índices:', error.message);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alertas_id_usuario"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alertas_id_sensor"`);
    } catch (error) {
      console.log('Error al eliminar índices:', error.message);
    }
  }
}
