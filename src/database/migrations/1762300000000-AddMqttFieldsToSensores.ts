import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMqttFieldsToSensores1762300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add MQTT configuration columns to sensores table
        await queryRunner.query(`
            ALTER TABLE "sensores"
            ADD COLUMN IF NOT EXISTS "mqtt_host" character varying,
            ADD COLUMN IF NOT EXISTS "mqtt_port" integer,
            ADD COLUMN IF NOT EXISTS "mqtt_topic" character varying,
            ADD COLUMN IF NOT EXISTS "mqtt_username" character varying,
            ADD COLUMN IF NOT EXISTS "mqtt_password" character varying,
            ADD COLUMN IF NOT EXISTS "mqtt_enabled" boolean DEFAULT false,
            ADD COLUMN IF NOT EXISTS "mqtt_client_id" character varying
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove MQTT configuration columns from sensores table
        await queryRunner.query(`
            ALTER TABLE "sensores"
            DROP COLUMN IF EXISTS "mqtt_client_id",
            DROP COLUMN IF EXISTS "mqtt_enabled",
            DROP COLUMN IF EXISTS "mqtt_password",
            DROP COLUMN IF EXISTS "mqtt_username",
            DROP COLUMN IF EXISTS "mqtt_topic",
            DROP COLUMN IF EXISTS "mqtt_port",
            DROP COLUMN IF EXISTS "mqtt_host"
        `);
    }
}