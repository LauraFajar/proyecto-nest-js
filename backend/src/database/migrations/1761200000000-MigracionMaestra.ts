import { MigrationInterface, QueryRunner } from "typeorm";

export class MigracionMaestra1761200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const alertasExists = await queryRunner.hasTable("alertas");
        if (!alertasExists) {
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
        }

        await queryRunner.query(`
            DO $$
            BEGIN
                -- Verificar si la columna id_epa existe en la tabla epa
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'epa' AND column_name = 'id_epa'
                ) THEN
                    ALTER TABLE epa ADD COLUMN id_epa SERIAL PRIMARY KEY;
                END IF;

                -- Verificar si la columna id_tratamiento existe en la tabla tratamientos
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'tratamientos' AND column_name = 'id_tratamiento'
                ) THEN
                    ALTER TABLE tratamientos ADD COLUMN id_tratamiento SERIAL PRIMARY KEY;
                END IF;
            END
            $$;
        `);

        const sensoresExists = await queryRunner.hasTable("sensores");
        if (sensoresExists) {
            const hasTipoSensor = await queryRunner.hasColumn("sensores", "tipo_sensor");
            if (!hasTipoSensor) {
                await queryRunner.query(`ALTER TABLE "sensores" ADD COLUMN "tipo_sensor" character varying`);
            }
            
            const hasUbicacion = await queryRunner.hasColumn("sensores", "ubicacion");
            if (!hasUbicacion) {
                await queryRunner.query(`ALTER TABLE "sensores" ADD COLUMN "ubicacion" character varying`);
            }
            
            const hasEstado = await queryRunner.hasColumn("sensores", "estado");
            if (!hasEstado) {
                await queryRunner.query(`ALTER TABLE "sensores" ADD COLUMN "estado" character varying DEFAULT 'activo'`);
            }
        }

        if (sensoresExists) {
            const hasIdSublote = await queryRunner.hasColumn("sensores", "id_sublote");
            if (!hasIdSublote) {
                await queryRunner.query(`ALTER TABLE "sensores" ADD COLUMN "id_sublote" integer`);
                await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_sensores_id_sublote" ON "sensores" ("id_sublote")`);
            }
        }

        const usuariosExists = await queryRunner.hasTable("usuarios");
        if (usuariosExists) {
            const hasImagenUrl = await queryRunner.hasColumn("usuarios", "imagen_url");
            if (!hasImagenUrl) {
                await queryRunner.query(`ALTER TABLE "usuarios" ADD COLUMN "imagen_url" character varying`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}