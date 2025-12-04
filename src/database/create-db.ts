import 'dotenv/config';
import { Client } from 'pg';

async function ensureDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || '1234';
  const targetDb = process.env.DB_DATABASE || 'api_proyecto_actualizada';

  // Conectamos al DB por defecto 'postgres' para poder crear otra base
  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    console.log(`Conectando a ${host}:${port} como ${user} (base: postgres)...`);
    await client.connect();

    const existsRes = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [targetDb]);
    const exists = existsRes.rowCount > 0;

    if (exists) {
      console.log(`La base '${targetDb}' ya existe. No se crea.`);
    } else {
      console.log(`Creando base '${targetDb}'...`);
      await client.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Base '${targetDb}' creada correctamente.`);
    }
  } catch (err) {
    console.error('Error creando/verificando la base:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

ensureDatabase();