import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTratamientoInsumosTable1765307000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "tratamiento_insumos",
                columns: [
                    {
                        name: "id_tratamiento_insumo",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "id_tratamiento",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "id_insumo",
                        type: "int",
                        isNullable: false,
                    },
                    {
                        name: "cantidad_usada",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: "unidad_medida",
                        type: "varchar",
                        length: "20",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "tratamiento_insumos",
            new TableForeignKey({
                columnNames: ["id_tratamiento"],
                referencedTableName: "tratamientos",
                referencedColumnNames: ["id_tratamiento"],
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "tratamiento_insumos",
            new TableForeignKey({
                columnNames: ["id_insumo"],
                referencedTableName: "insumos",
                referencedColumnNames: ["id_insumo"],
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("tratamiento_insumos");
    }
}
