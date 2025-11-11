import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameTipoCultivoToNombreCultivoAndAddTipoCultivo1761786855531 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const cultivosExists = await queryRunner.hasTable('cultivos');
        if (!cultivosExists) return;
        const table = await queryRunner.getTable('cultivos');
        const hasTipo = table?.findColumnByName('tipo_cultivo');
        const hasNombre = table?.findColumnByName('nombre_cultivo');

        if (hasTipo && !hasNombre) {
            await queryRunner.query(`ALTER TABLE cultivos RENAME COLUMN tipo_cultivo TO nombre_cultivo`);
        }
        const tableAfterRename = await queryRunner.getTable('cultivos');
        const hasNombreAfter = tableAfterRename?.findColumnByName('nombre_cultivo');
        if (hasNombreAfter) {
            await queryRunner.query(`ALTER TABLE cultivos ALTER COLUMN nombre_cultivo TYPE VARCHAR(100)`);
        }
        const hasTipoFinal = (await queryRunner.getTable('cultivos'))?.findColumnByName('tipo_cultivo');
        if (!hasTipoFinal) {
            await queryRunner.query(`ALTER TABLE cultivos ADD COLUMN tipo_cultivo VARCHAR(20) NOT NULL DEFAULT 'transitorios'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const cultivosExists = await queryRunner.hasTable('cultivos');
        if (!cultivosExists) return;
        const table = await queryRunner.getTable('cultivos');
        const hasTipo = table?.findColumnByName('tipo_cultivo');
        const hasNombre = table?.findColumnByName('nombre_cultivo');

        if (hasTipo) {
            await queryRunner.query(`ALTER TABLE cultivos DROP COLUMN tipo_cultivo`);
        }
        if (hasNombre) {
            await queryRunner.query(`ALTER TABLE cultivos ALTER COLUMN nombre_cultivo TYPE VARCHAR(20)`);
        }
        const tableAfterAlter = await queryRunner.getTable('cultivos');
        const hasNombreAfter = tableAfterAlter?.findColumnByName('nombre_cultivo');
        const hasTipoAfter = tableAfterAlter?.findColumnByName('tipo_cultivo');
        if (hasNombreAfter && !hasTipoAfter) {
            await queryRunner.query(`ALTER TABLE cultivos RENAME COLUMN nombre_cultivo TO tipo_cultivo`);
        }
    }

}
