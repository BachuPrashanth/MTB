import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { pool } from './pool.js';

const schemaFile = new URL('../../../script.sql', import.meta.url);
const fullSchema = await readFile(schemaFile, 'utf8');
const tableSchema = fullSchema.split(/\ncreate view /i)[0];
const idempotentTableSchema = tableSchema
  .replace(/\bcreate sequence\b/gi, 'create sequence if not exists')
  .replace(/\bcreate table\b/gi, 'create table if not exists')
  .replace(/\bcreate unique index\b/gi, 'create unique index if not exists')
  .replace(/\bcreate index\b/gi, 'create index if not exists');

await pool.query('create schema if not exists mtbtracking');
await pool.query(`set search_path to mtbtracking, public`);
await pool.query(idempotentTableSchema);
await pool.end();
console.log('Database migration complete. Created mtbtracking tables from script.sql.');
