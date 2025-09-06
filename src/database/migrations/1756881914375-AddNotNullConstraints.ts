import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotNullConstraints1756881914375 implements MigrationInterface {
    name = 'AddNotNullConstraints1756881914375'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // LOTES
        await queryRunner.query(`UPDATE "lotes" SET "nombre_lote" = 'sin_nombre' WHERE "nombre_lote" IS NULL`);
        await queryRunner.query(`ALTER TABLE "lotes" ALTER COLUMN "nombre_lote" SET DEFAULT 'sin_nombre'`);
        await queryRunner.query(`ALTER TABLE "lotes" ALTER COLUMN "nombre_lote" SET NOT NULL`);

        await queryRunner.query(`UPDATE "lotes" SET "descripcion" = 'sin_descripcion' WHERE "descripcion" IS NULL`);
        await queryRunner.query(`ALTER TABLE "lotes" ALTER COLUMN "descripcion" SET DEFAULT 'sin_descripcion'`);
        await queryRunner.query(`ALTER TABLE "lotes" ALTER COLUMN "descripcion" SET NOT NULL`);

        // CATEGORIAS
        await queryRunner.query(`UPDATE "categorias" SET "nombre" = 'Sin Nombre' WHERE "nombre" IS NULL`);
        await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "nombre" SET DEFAULT 'Sin Nombre'`);
        await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "nombre" SET NOT NULL`);

        await queryRunner.query(`UPDATE "categorias" SET "descripcion" = 'Sin Descripción' WHERE "descripcion" IS NULL`);
        await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "descripcion" SET DEFAULT 'Sin Descripción'`);
        await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "descripcion" SET NOT NULL`);

        // ALMACENES
        await queryRunner.query(`UPDATE "almacenes" SET "nombre" = 'sin_nombre' WHERE "nombre" IS NULL`);
        await queryRunner.query(`ALTER TABLE "almacenes" ALTER COLUMN "nombre" SET DEFAULT 'sin_nombre'`);
        await queryRunner.query(`ALTER TABLE "almacenes" ALTER COLUMN "nombre" SET NOT NULL`);

        await queryRunner.query(`UPDATE "almacenes" SET "ubicacion" = 'sin_ubicacion' WHERE "ubicacion" IS NULL`);
        await queryRunner.query(`ALTER TABLE "almacenes" ALTER COLUMN "ubicacion" SET DEFAULT 'sin_ubicacion'`);
        await queryRunner.query(`ALTER TABLE "almacenes" ALTER COLUMN "ubicacion" SET NOT NULL`);

        // USUARIOS
        await queryRunner.query(`UPDATE "usuarios" SET "nombre" = 'sin_nombre' WHERE "nombre" IS NULL`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "nombre" SET DEFAULT 'sin_nombre'`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "nombre" SET NOT NULL`);

        await queryRunner.query(`UPDATE "usuarios" SET "correo" = 'sin_correo' WHERE "correo" IS NULL`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "correo" SET DEFAULT 'sin_correo'`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "correo" SET NOT NULL`);

        await queryRunner.query(`UPDATE "usuarios" SET "contrasena" = 'sin_contrasena' WHERE "contrasena" IS NULL`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "contrasena" SET DEFAULT 'sin_contrasena'`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "contrasena" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revertir cambios en LOTES
        await queryRunner.query(`ALTER TABLE "lotes" ALTER COLUMN "nombre_lote" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lotes" ALTER COLUMN "nombre_lote" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lotes" ALTER COLUMN "descripcion" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "lotes" ALTER COLUMN "descripcion" DROP NOT NULL`);

        // Revertir cambios en CATEGORIAS
        await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "nombre" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "nombre" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "descripcion" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "categorias" ALTER COLUMN "descripcion" DROP NOT NULL`);

        // Revertir cambios en ALMACENES
        await queryRunner.query(`ALTER TABLE "almacenes" ALTER COLUMN "nombre" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "almacenes" ALTER COLUMN "nombre" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "almacenes" ALTER COLUMN "ubicacion" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "almacenes" ALTER COLUMN "ubicacion" DROP NOT NULL`);

        // Revertir cambios en USUARIOS
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "nombre" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "nombre" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "correo" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "correo" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "contrasena" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "contrasena" DROP NOT NULL`);
    }
}
