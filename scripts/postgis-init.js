require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_DATABASE || 'api_proyecto_actualizada',
  });

  try {
    await client.connect();
    await client.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    console.log('PostGIS extension ensured.');
  } catch (err) {
    console.error('Failed to create PostGIS extension:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();