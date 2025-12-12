import { MigrationInterface, QueryRunner, Table, ForeignKey } from 'typeorm';

export class CreateLecturasTable1764000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'lecturas',
        columns: [
          {
            name: 'id_lectura',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'sensor_id',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'mqtt_topic',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'fecha',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'valor',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'unidad_medida',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'observaciones',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.query(`
      ALTER TABLE lecturas 
      ADD CONSTRAINT FK_lectura_sensor 
      FOREIGN KEY (sensor_id) 
      REFERENCES sensores(id_sensor) 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_lectura_topic ON lecturas(mqtt_topic)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_lectura_fecha ON lecturas(fecha)
    `);
    
    await queryRunner.query(`
      CREATE INDEX idx_lectura_metric ON lecturas(unidad_medida)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS lecturas`);
  }
}
