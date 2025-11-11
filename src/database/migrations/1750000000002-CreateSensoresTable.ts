import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateSensoresTable1750000000002 implements MigrationInterface {
  name = 'CreateSensoresTable1750000000002'
  public async up(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("sensores");
    if (exists) return;
    await queryRunner.createTable(
      new Table({
        name: "sensores",
        columns: [
          { name: "id_sensor", type: "serial", isPrimary: true },
          { name: "tipo_sensor", type: "varchar", isNullable: false },
          { name: "valor_minimo", type: "decimal", precision: 10, scale: 2, isNullable: true },
          { name: "valor_maximo", type: "decimal", precision: 10, scale: 2, isNullable: true },
          { name: "valor_actual", type: "decimal", precision: 10, scale: 2, isNullable: true },
          { name: "ultima_lectura", type: "timestamp", isNullable: true },
          { name: "estado", type: "varchar", isNullable: false, default: "'activo'" },
          { name: "configuracion", type: "text", isNullable: true },
          { name: "historial_lecturas", type: "json", isNullable: true },
          { name: "created_at", type: "timestamp", default: "now()" },
          { name: "updated_at", type: "timestamp", default: "now()" },
        ],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const exists = await queryRunner.hasTable("sensores");
    if (!exists) return;
    await queryRunner.query(`DROP TABLE IF EXISTS "sensores"`);
  }
}