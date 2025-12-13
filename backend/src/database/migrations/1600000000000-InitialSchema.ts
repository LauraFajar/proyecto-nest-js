import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1600000000000 implements MigrationInterface {
    name = 'InitialSchema1600000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tiporol" ("id_tipo_rol" SERIAL NOT NULL, "descripcion" character varying NOT NULL, CONSTRAINT "PK_5b72cf9b7a1608a0da583e6b692" PRIMARY KEY ("id_tipo_rol"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "rol" ("id_rol" SERIAL NOT NULL, "nombre_rol" character varying NOT NULL, "id_tipo_rol" integer, CONSTRAINT "PK_0b42a30072d57ccfad9949218da" PRIMARY KEY ("id_rol"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "permisos" ("id_permiso" SERIAL NOT NULL, "clave" character varying(64) NOT NULL, "recurso" character varying(128) NOT NULL, "accion" character varying(128) NOT NULL, "nombre_permiso" character varying(128) NOT NULL, "descripcion" text, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_0da1398fc247170cac89e492051" UNIQUE ("clave"), CONSTRAINT "PK_76e2dbb965cd631705b6caaf698" PRIMARY KEY ("id_permiso"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "usuarios" ("id_usuarios" SERIAL NOT NULL, "nombres" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "tipo_documento" character varying NOT NULL, "numero_documento" character varying NOT NULL, "reset_token" character varying, "reset_token_expires" TIMESTAMP, "imagen_url" character varying(255), "id_rol" integer, CONSTRAINT "PK_e3a0eed1134b92a38fad2b8fbd9" PRIMARY KEY ("id_usuarios"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "sensores" ("id_sensor" SERIAL NOT NULL, "tipo_sensor" character varying NOT NULL, "valor_minimo" numeric(10,2), "valor_maximo" numeric(10,2), "valor_actual" numeric(10,2), "ultima_lectura" TIMESTAMP, "estado" character varying(20) NOT NULL DEFAULT 'activo', "configuracion" text, "historial_lecturas" json, "mqtt_host" character varying, "mqtt_port" integer, "mqtt_topic" character varying, "mqtt_username" character varying, "mqtt_password" character varying, "mqtt_enabled" boolean NOT NULL DEFAULT false, "mqtt_client_id" character varying, "https_url" character varying, "https_method" character varying, "https_headers" character varying, "https_enabled" boolean NOT NULL DEFAULT false, "https_auth_token" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id_sublote" integer, "cultivo_id" integer, CONSTRAINT "PK_6cdb552a09db5a9adbf8a3f28f2" PRIMARY KEY ("id_sensor"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "sublotes" ("id_sublote" SERIAL NOT NULL, "descripcion" character varying(50) NOT NULL, "ubicacion" character varying(50) NOT NULL, "coordenadas" geography(Polygon,4326), "id_lote" integer, CONSTRAINT "PK_ce52ff8605f17c772707f27fd12" PRIMARY KEY ("id_sublote"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "lotes" ("id_lote" SERIAL NOT NULL, "nombre_lote" character varying(30) NOT NULL, "descripcion" character varying(50), "activo" boolean NOT NULL DEFAULT true, "coordenadas" geography(Polygon,4326), CONSTRAINT "PK_268921534e5419c12c6bdd92ca0" PRIMARY KEY ("id_lote"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "categorias" ("id_categoria" SERIAL NOT NULL, "nombre" character varying NOT NULL, "descripcion" character varying NOT NULL, CONSTRAINT "PK_04bae980e284752e914bce1cbc7" PRIMARY KEY ("id_categoria"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS"almacenes" ("id_almacen" SERIAL NOT NULL, "nombre_almacen" character varying NOT NULL, "descripcion" character varying NOT NULL, CONSTRAINT "PK_6be1b1ac0d281b886b0085673f9" PRIMARY KEY ("id_almacen"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "salidas" ("id_salida" SERIAL NOT NULL, "nombre" character varying NOT NULL, "codigo" character varying NOT NULL, "cantidad" integer NOT NULL, "observacion" character varying NOT NULL, "fecha_salida" date NOT NULL, "valor_unidad" numeric(10,2), "unidad_medida" character varying(64), "estado" character varying NOT NULL DEFAULT 'completado', "id_cultivo" integer, "id_categorias" integer, "id_almacenes" integer, "id_insumo" integer, CONSTRAINT "PK_4c91fe5d211b7343e771f1c14f5" PRIMARY KEY ("id_salida"))`);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'epa_tipo_enum') THEN
                    CREATE TYPE "public"."epa_tipo_enum" AS ENUM('enfermedad', 'plaga', 'arvense');
                END IF;
            END$$;
        `);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "epa" ("id_epa" SERIAL NOT NULL, "nombre_epa" character varying NOT NULL, "descripcion" character varying NOT NULL, "imagen_referencia" character varying, "tipo" "public"."epa_tipo_enum" NOT NULL DEFAULT 'enfermedad', "estado" character varying NOT NULL DEFAULT 'activo', CONSTRAINT "PK_b12986560103d6fcecaf8bc8aea" PRIMARY KEY ("id_epa"))`);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tratamientos_tipo_enum') THEN
                    CREATE TYPE "public"."tratamientos_tipo_enum" AS ENUM('Biologico', 'Quimico');
                END IF;
            END$$;
        `);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tratamientos" ("id_tratamiento" SERIAL NOT NULL, "descripcion" text NOT NULL, "dosis" character varying NOT NULL, "frecuencia" character varying NOT NULL, "tipo" "public"."tratamientos_tipo_enum" NOT NULL DEFAULT 'Biologico', "id_epa" integer, CONSTRAINT "PK_7d2021e1aefdf08cddf2692d7af" PRIMARY KEY ("id_tratamiento"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tratamiento_insumos" ("id_tratamiento_insumo" SERIAL NOT NULL, "id_tratamiento" integer NOT NULL, "id_insumo" integer NOT NULL, "cantidad_usada" numeric(10,2) NOT NULL, "unidad_medida" character varying(20), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e85aebcdf62a9042b9ed429f8eb" PRIMARY KEY ("id_tratamiento_insumo"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "insumos" ("id_insumo" SERIAL NOT NULL, "nombre_insumo" character varying NOT NULL, "codigo" character varying NOT NULL, "fecha_entrada" date NOT NULL, "observacion" character varying NOT NULL, "es_herramienta" boolean NOT NULL DEFAULT false, "costo_compra" numeric(12,2), "vida_util_horas" numeric(10,2), "depreciacion_por_hora" numeric(12,2), "depreciacion_acumulada" numeric(12,2) DEFAULT '0', "fecha_compra" date, "tipo_insumo" character varying(20) DEFAULT 'consumible', "id_categoria" integer, "id_almacen" integer, CONSTRAINT "PK_c8b6a3187fad8d5db90d206d0f4" PRIMARY KEY ("id_insumo"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "cultivos" ("id_cultivo" SERIAL NOT NULL, "nombre_cultivo" character varying(100) NOT NULL, "tipo_cultivo" character varying(20) NOT NULL, "fecha_siembra" date, "fecha_cosecha_estimada" date, "fecha_cosecha_real" date, "estado_cultivo" character varying NOT NULL DEFAULT 'sembrado', "observaciones" text, "id_lote" integer, "id_insumo" integer, CONSTRAINT "PK_877f85bdb5806124287a27844a2" PRIMARY KEY ("id_cultivo"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "fotos_actividades" ("id" SERIAL NOT NULL, "url_imagen" character varying(255) NOT NULL, "descripcion" text, "fecha_carga" TIMESTAMP NOT NULL DEFAULT now(), "id_actividad" integer, CONSTRAINT "PK_270ea5e4421b5ece01c2ccadca7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "actividades" ("id_actividad" SERIAL NOT NULL, "tipo_actividad" character varying(20) NOT NULL, "fecha" date NOT NULL, "responsable" character varying(50) NOT NULL, "responsable_id" integer, "detalles" character varying(50) NOT NULL, "costo_mano_obra" numeric(12,2) DEFAULT '0', "horas_trabajadas" numeric(10,2), "tarifa_hora" numeric(10,2), "costo_maquinaria" numeric(12,2) DEFAULT '0', "estado" character varying(20) DEFAULT 'pendiente', "id_cultivo" integer, CONSTRAINT "PK_ffb82d90c49c4823faadceaea39" PRIMARY KEY ("id_actividad"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "utiliza" ("id_utiliza" SERIAL NOT NULL, "cantidad" numeric(12,2), "horas_uso" numeric(10,2), "costo_unitario" numeric(12,2), "id_actividades" integer, "id_insumos" integer, CONSTRAINT "PK_e6ffcc31dc37c0a80e6bf8047e3" PRIMARY KEY ("id_utiliza"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "tiene" ("id_tiene" SERIAL NOT NULL, "cultivo" integer, "epa" integer, CONSTRAINT "PK_2d3cda6f8c23dad8e6ecd6d6ad0" PRIMARY KEY ("id_tiene"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "lecturas" ("id_lectura" SERIAL NOT NULL, "mqtt_topic" character varying(255), "fecha" TIMESTAMP NOT NULL, "valor" numeric(10,2) NOT NULL, "unidad_medida" character varying(50), "observaciones" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "sensor_id" integer, CONSTRAINT "PK_e048b6fb194c4832e25ecf8e965" PRIMARY KEY ("id_lectura"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "realiza" ("id_realiza" SERIAL NOT NULL, "usuario" integer, "actividad" integer, CONSTRAINT "PK_cbfb8efe2e311719de616f0767b" PRIMARY KEY ("id_realiza"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "movimientos" ("id_movimiento" SERIAL NOT NULL, "tipo_movimiento" character varying NOT NULL, "cantidad" integer NOT NULL, "unidad_medida" character varying NOT NULL, "fecha_movimiento" date NOT NULL, "id_insumo" integer, CONSTRAINT "PK_3883c5e72c07666baf33f846f8c" PRIMARY KEY ("id_movimiento"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "inventario" ("id_inventario" SERIAL NOT NULL, "cantidad_stock" integer NOT NULL, "unidad_medida" character varying NOT NULL, "fecha" date, "id_insumo" integer, CONSTRAINT "REL_c84aac6878472caed7b255ac2c" UNIQUE ("id_insumo"), CONSTRAINT "PK_d026f8a15da0fe506783e4ccb7f" PRIMARY KEY ("id_inventario"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "ingresos" ("id_ingreso" SERIAL NOT NULL, "fecha_ingreso" date NOT NULL, "monto" numeric NOT NULL, "descripcion" character varying NOT NULL, "id_cultivo" integer, "id_insumo" integer, CONSTRAINT "PK_bab6560bbb731ebfb4cde53588e" PRIMARY KEY ("id_ingreso"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "password_resets" ("id_reset" SERIAL NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP NOT NULL DEFAULT now(), "used" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "id_usuario" integer NOT NULL, CONSTRAINT "PK_2aca97c91ae84360de86b42745b" PRIMARY KEY ("id_reset"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "alertas" ("id_alerta" SERIAL NOT NULL, "tipo_alerta" character varying NOT NULL, "descripcion" character varying NOT NULL, "fecha" date NOT NULL, "hora" TIME NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "id_sensor" integer, "id_usuario" integer, CONSTRAINT "PK_5b0e0217a06d4dab329bab08b8c" PRIMARY KEY ("id_alerta"))`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "usuario_permisos" ("id_usuarios" integer NOT NULL, "id_permiso" integer NOT NULL, CONSTRAINT "PK_b2231c4b957889f3ef835123eaf" PRIMARY KEY ("id_usuarios", "id_permiso"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_c4f696975efa47987bddfcfee0" ON "usuario_permisos" ("id_usuarios") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_f90aceca177c33022e320d4654" ON "usuario_permisos" ("id_permiso") `);
        await queryRunner.query(`ALTER TABLE "rol" ADD CONSTRAINT "FK_c9f4f18d3f8573c1ce0435a0f98" FOREIGN KEY ("id_tipo_rol") REFERENCES "tiporol"("id_tipo_rol") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "FK_98bf89ebf4b0be2d3825f54e56c" FOREIGN KEY ("id_rol") REFERENCES "rol"("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sensores" ADD CONSTRAINT "FK_08a6b01270edd28e6231d7d9662" FOREIGN KEY ("id_sublote") REFERENCES "sublotes"("id_sublote") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sensores" ADD CONSTRAINT "FK_befdd72567254c8f8947ea02edd" FOREIGN KEY ("cultivo_id") REFERENCES "cultivos"("id_cultivo") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sublotes" ADD CONSTRAINT "FK_402c7b041c377e936f088fc4acc" FOREIGN KEY ("id_lote") REFERENCES "lotes"("id_lote") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salidas" ADD CONSTRAINT "FK_d06f53ff79db50db738d290274c" FOREIGN KEY ("id_categorias") REFERENCES "categorias"("id_categoria") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salidas" ADD CONSTRAINT "FK_8fa8a4290d22f70b180aeaba05a" FOREIGN KEY ("id_almacenes") REFERENCES "almacenes"("id_almacen") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salidas" ADD CONSTRAINT "FK_931506feaf6717b4e675b22f8d6" FOREIGN KEY ("id_insumo") REFERENCES "insumos"("id_insumo") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salidas" ADD CONSTRAINT "FK_75486bb253621d3c90ccf6b862d" FOREIGN KEY ("id_cultivo") REFERENCES "cultivos"("id_cultivo") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tratamientos" ADD CONSTRAINT "FK_c264dd369f02b1a9812442b741a" FOREIGN KEY ("id_epa") REFERENCES "epa"("id_epa") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tratamiento_insumos" ADD CONSTRAINT "FK_f38df5e83a3006f589be54d3c24" FOREIGN KEY ("id_tratamiento") REFERENCES "tratamientos"("id_tratamiento") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tratamiento_insumos" ADD CONSTRAINT "FK_f9dbc9f794e9ac3ee7305762267" FOREIGN KEY ("id_insumo") REFERENCES "insumos"("id_insumo") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insumos" ADD CONSTRAINT "FK_373411ec623c71426939f584915" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id_categoria") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "insumos" ADD CONSTRAINT "FK_1e368ce0a62cb1de127480d68d6" FOREIGN KEY ("id_almacen") REFERENCES "almacenes"("id_almacen") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cultivos" ADD CONSTRAINT "FK_0fdd32679bad7a21a0bcdd017ee" FOREIGN KEY ("id_lote") REFERENCES "lotes"("id_lote") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cultivos" ADD CONSTRAINT "FK_fc049d456f31065be655d918e9a" FOREIGN KEY ("id_insumo") REFERENCES "insumos"("id_insumo") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "fotos_actividades" ADD CONSTRAINT "FK_ad316eae4058576692f3a9a877e" FOREIGN KEY ("id_actividad") REFERENCES "actividades"("id_actividad") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "actividades" ADD CONSTRAINT "FK_2912c7b36eb731ac61d78dfc50c" FOREIGN KEY ("id_cultivo") REFERENCES "cultivos"("id_cultivo") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "actividades" ADD CONSTRAINT "FK_d8d07dc6231292d800a044c8168" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id_usuarios") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "utiliza" ADD CONSTRAINT "FK_3d09e333ef4193b8ad85f20e8ea" FOREIGN KEY ("id_actividades") REFERENCES "actividades"("id_actividad") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "utiliza" ADD CONSTRAINT "FK_dad426485caf1e363b7a2881704" FOREIGN KEY ("id_insumos") REFERENCES "insumos"("id_insumo") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tiene" ADD CONSTRAINT "FK_d2b27090a59f77631c4cd398e15" FOREIGN KEY ("cultivo") REFERENCES "cultivos"("id_cultivo") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tiene" ADD CONSTRAINT "FK_737f5b1855d8990488c425d7318" FOREIGN KEY ("epa") REFERENCES "epa"("id_epa") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lecturas" ADD CONSTRAINT "FK_b772a5e273d4adf2b2ce24f9995" FOREIGN KEY ("sensor_id") REFERENCES "sensores"("id_sensor") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "realiza" ADD CONSTRAINT "FK_93ebd7dbdfb4727587a0aecf127" FOREIGN KEY ("usuario") REFERENCES "usuarios"("id_usuarios") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "realiza" ADD CONSTRAINT "FK_33183da7d588462e2ef72d28025" FOREIGN KEY ("actividad") REFERENCES "actividades"("id_actividad") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos" ADD CONSTRAINT "FK_4f20c9d68a15de035757bae149a" FOREIGN KEY ("id_insumo") REFERENCES "insumos"("id_insumo") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventario" ADD CONSTRAINT "FK_c84aac6878472caed7b255ac2ca" FOREIGN KEY ("id_insumo") REFERENCES "insumos"("id_insumo") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ingresos" ADD CONSTRAINT "FK_da9bcaa89a570bb10cd579b80a7" FOREIGN KEY ("id_insumo") REFERENCES "insumos"("id_insumo") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ingresos" ADD CONSTRAINT "FK_21da371f25714e9fa76de26a1ea" FOREIGN KEY ("id_cultivo") REFERENCES "cultivos"("id_cultivo") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_resets" ADD CONSTRAINT "FK_d9316e2d1085a1c96bf97230381" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuarios") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alertas" ADD CONSTRAINT "FK_104a9af0a30efc6403c553b1bdc" FOREIGN KEY ("id_sensor") REFERENCES "sensores"("id_sensor") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "alertas" ADD CONSTRAINT "FK_3478a1b18d660dc7c4a08f16f26" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuarios") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usuario_permisos" ADD CONSTRAINT "FK_c4f696975efa47987bddfcfee09" FOREIGN KEY ("id_usuarios") REFERENCES "usuarios"("id_usuarios") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "usuario_permisos" ADD CONSTRAINT "FK_f90aceca177c33022e320d46544" FOREIGN KEY ("id_permiso") REFERENCES "permisos"("id_permiso") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuario_permisos" DROP CONSTRAINT "FK_f90aceca177c33022e320d46544"`);
        await queryRunner.query(`ALTER TABLE "usuario_permisos" DROP CONSTRAINT "FK_c4f696975efa47987bddfcfee09"`);
        await queryRunner.query(`ALTER TABLE "alertas" DROP CONSTRAINT "FK_3478a1b18d660dc7c4a08f16f26"`);
        await queryRunner.query(`ALTER TABLE "alertas" DROP CONSTRAINT "FK_104a9af0a30efc6403c553b1bdc"`);
        await queryRunner.query(`ALTER TABLE "password_resets" DROP CONSTRAINT "FK_d9316e2d1085a1c96bf97230381"`);
        await queryRunner.query(`ALTER TABLE "ingresos" DROP CONSTRAINT "FK_21da371f25714e9fa76de26a1ea"`);
        await queryRunner.query(`ALTER TABLE "ingresos" DROP CONSTRAINT "FK_da9bcaa89a570bb10cd579b80a7"`);
        await queryRunner.query(`ALTER TABLE "inventario" DROP CONSTRAINT "FK_c84aac6878472caed7b255ac2ca"`);
        await queryRunner.query(`ALTER TABLE "movimientos" DROP CONSTRAINT "FK_4f20c9d68a15de035757bae149a"`);
        await queryRunner.query(`ALTER TABLE "realiza" DROP CONSTRAINT "FK_33183da7d588462e2ef72d28025"`);
        await queryRunner.query(`ALTER TABLE "realiza" DROP CONSTRAINT "FK_93ebd7dbdfb4727587a0aecf127"`);
        await queryRunner.query(`ALTER TABLE "lecturas" DROP CONSTRAINT "FK_b772a5e273d4adf2b2ce24f9995"`);
        await queryRunner.query(`ALTER TABLE "tiene" DROP CONSTRAINT "FK_737f5b1855d8990488c425d7318"`);
        await queryRunner.query(`ALTER TABLE "tiene" DROP CONSTRAINT "FK_d2b27090a59f77631c4cd398e15"`);
        await queryRunner.query(`ALTER TABLE "utiliza" DROP CONSTRAINT "FK_dad426485caf1e363b7a2881704"`);
        await queryRunner.query(`ALTER TABLE "utiliza" DROP CONSTRAINT "FK_3d09e333ef4193b8ad85f20e8ea"`);
        await queryRunner.query(`ALTER TABLE "actividades" DROP CONSTRAINT "FK_d8d07dc6231292d800a044c8168"`);
        await queryRunner.query(`ALTER TABLE "actividades" DROP CONSTRAINT "FK_2912c7b36eb731ac61d78dfc50c"`);
        await queryRunner.query(`ALTER TABLE "fotos_actividades" DROP CONSTRAINT "FK_ad316eae4058576692f3a9a877e"`);
        await queryRunner.query(`ALTER TABLE "cultivos" DROP CONSTRAINT "FK_fc049d456f31065be655d918e9a"`);
        await queryRunner.query(`ALTER TABLE "cultivos" DROP CONSTRAINT "FK_0fdd32679bad7a21a0bcdd017ee"`);
        await queryRunner.query(`ALTER TABLE "insumos" DROP CONSTRAINT "FK_1e368ce0a62cb1de127480d68d6"`);
        await queryRunner.query(`ALTER TABLE "insumos" DROP CONSTRAINT "FK_373411ec623c71426939f584915"`);
        await queryRunner.query(`ALTER TABLE "tratamiento_insumos" DROP CONSTRAINT "FK_f9dbc9f794e9ac3ee7305762267"`);
        await queryRunner.query(`ALTER TABLE "tratamiento_insumos" DROP CONSTRAINT "FK_f38df5e83a3006f589be54d3c24"`);
        await queryRunner.query(`ALTER TABLE "tratamientos" DROP CONSTRAINT "FK_c264dd369f02b1a9812442b741a"`);
        await queryRunner.query(`ALTER TABLE "salidas" DROP CONSTRAINT "FK_75486bb253621d3c90ccf6b862d"`);
        await queryRunner.query(`ALTER TABLE "salidas" DROP CONSTRAINT "FK_931506feaf6717b4e675b22f8d6"`);
        await queryRunner.query(`ALTER TABLE "salidas" DROP CONSTRAINT "FK_8fa8a4290d22f70b180aeaba05a"`);
        await queryRunner.query(`ALTER TABLE "salidas" DROP CONSTRAINT "FK_d06f53ff79db50db738d290274c"`);
        await queryRunner.query(`ALTER TABLE "sublotes" DROP CONSTRAINT "FK_402c7b041c377e936f088fc4acc"`);
        await queryRunner.query(`ALTER TABLE "sensores" DROP CONSTRAINT "FK_befdd72567254c8f8947ea02edd"`);
        await queryRunner.query(`ALTER TABLE "sensores" DROP CONSTRAINT "FK_08a6b01270edd28e6231d7d9662"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "FK_98bf89ebf4b0be2d3825f54e56c"`);
        await queryRunner.query(`ALTER TABLE "rol" DROP CONSTRAINT "FK_c9f4f18d3f8573c1ce0435a0f98"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f90aceca177c33022e320d4654"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c4f696975efa47987bddfcfee0"`);
        await queryRunner.query(`DROP TABLE "usuario_permisos"`);
        await queryRunner.query(`DROP TABLE "alertas"`);
        await queryRunner.query(`DROP TABLE "password_resets"`);
        await queryRunner.query(`DROP TABLE "ingresos"`);
        await queryRunner.query(`DROP TABLE "inventario"`);
        await queryRunner.query(`DROP TABLE "movimientos"`);
        await queryRunner.query(`DROP TABLE "realiza"`);
        await queryRunner.query(`DROP TABLE "lecturas"`);
        await queryRunner.query(`DROP TABLE "tiene"`);
        await queryRunner.query(`DROP TABLE "utiliza"`);
        await queryRunner.query(`DROP TABLE "actividades"`);
        await queryRunner.query(`DROP TABLE "fotos_actividades"`);
        await queryRunner.query(`DROP TABLE "cultivos"`);
        await queryRunner.query(`DROP TABLE "insumos"`);
        await queryRunner.query(`DROP TABLE "tratamiento_insumos"`);
        await queryRunner.query(`DROP TABLE "tratamientos"`);
        await queryRunner.query(`DROP TYPE "public"."tratamientos_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "epa"`);
        await queryRunner.query(`DROP TYPE "public"."epa_tipo_enum"`);
        await queryRunner.query(`DROP TABLE "salidas"`);
        await queryRunner.query(`DROP TABLE "almacenes"`);
        await queryRunner.query(`DROP TABLE "categorias"`);
        await queryRunner.query(`DROP TABLE "lotes"`);
        await queryRunner.query(`DROP TABLE "sublotes"`);
        await queryRunner.query(`DROP TABLE "sensores"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TABLE "permisos"`);
        await queryRunner.query(`DROP TABLE "rol"`);
        await queryRunner.query(`DROP TABLE "tiporol"`);
    }

}
