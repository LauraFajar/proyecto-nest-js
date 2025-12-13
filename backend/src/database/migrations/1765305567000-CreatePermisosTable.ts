import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreatePermisosTable1765305567000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "permisos",
                columns: [
                    {
                        name: "id_permiso",
                        type: "integer",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "clave",
                        type: "varchar",
                        length: "255",
                        isUnique: true,
                    },
                    {
                        name: "recurso",
                        type: "varchar",
                        length: "100",
                    },
                    {
                        name: "accion",
                        type: "varchar",
                        length: "50",
                    },
                    {
                        name: "nombre_permiso",
                        type: "varchar",
                        length: "255",
                    },
                    {
                        name: "descripcion",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "activo",
                        type: "boolean",
                        default: true,
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("permisos");
    }
}
