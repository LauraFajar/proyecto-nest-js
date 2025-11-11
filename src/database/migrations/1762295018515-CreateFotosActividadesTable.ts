import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateFotosActividadesTable1762295018515 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const exists = await queryRunner.hasTable("fotos_actividades");
        if (!exists) {
            await queryRunner.createTable(new Table({
            name: "fotos_actividades",
            columns: [
                {
                    name: "id",
                    type: "serial",
                    isPrimary: true,
                },
                {
                    name: "url_imagen",
                    type: "varchar",
                    length: "255",
                },
                {
                    name: "descripcion",
                    type: "text",
                    isNullable: true,
                },
                {
                    name: "fecha_carga",
                    type: "timestamp",
                    default: "now()",
                },
                {
                    name: "id_actividad",
                    type: "integer",
                },
            ],
        }), true);
        }
        const table = await queryRunner.getTable("fotos_actividades");
        const fkExists = table?.foreignKeys?.some(
            fk => fk.columnNames.includes("id_actividad") && fk.referencedTableName === "actividades"
        );
        if (!fkExists) {
            await queryRunner.createForeignKey("fotos_actividades", new TableForeignKey({
                columnNames: ["id_actividad"],
                referencedColumnNames: ["id_actividad"],
                referencedTableName: "actividades",
                onDelete: "CASCADE",
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("fotos_actividades");
        if (table) {
            const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("id_actividad") !== -1);
            if (foreignKey) {
                await queryRunner.dropForeignKey("fotos_actividades", foreignKey);
            }
            await queryRunner.dropTable("fotos_actividades");
        }
    }

}
