import { Router } from 'express';
import { z } from 'zod';
import { query } from './db/pool.js';

type ResourceConfig = {
  table: string;
  idColumn: string;
  fields: Record<string, string>;
  parentColumn?: string;
  parentField?: string;
  searchable?: string[];
  booleanColumns?: string[];
};

type SqlColumn = {
  apiName: string;
  dbName: string;
};

type JoinConfig = {
  table: string;
  columns: SqlColumn[];
  idColumn: string;
  parentColumn?: string;
  parentField?: string;
};

const dateLike = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (value === '' || value === undefined ? null : value));

const scalar = z.union([z.string(), z.number(), z.null(), z.undefined()]).transform((value) => {
  if (value === '') return null;
  if (value === undefined) return null;
  return value;
});

const bodySchema = z.record(z.string(), z.union([scalar, dateLike]));

function toSnake(name: string) {
  return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function quoteIdent(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

function serializeRow(row: Record<string, unknown>, columns: SqlColumn[], idColumn: string) {
  const out: Record<string, unknown> = {};
  for (const column of columns) {
    out[column.apiName] = row[column.dbName];
  }
  out.id = row[idColumn];
  return out;
}

function normalizeFields(fields: Record<string, string>) {
  return Object.entries(fields).map(([apiName, dbName]) => ({ apiName, dbName }));
}

function sanitizeBody(body: unknown, columns: SqlColumn[], booleanColumns: string[] = []) {
  const parsed = bodySchema.parse(body);
  const output: Record<string, unknown> = {};
  const allowed = new Map(columns.map((column) => [column.apiName, column.dbName]));
  const bools = new Set(booleanColumns);

  for (const [key, value] of Object.entries(parsed)) {
    const dbColumn = allowed.get(key) ?? allowed.get(toSnake(key));
    if (dbColumn) {
      if (bools.has(dbColumn) && typeof value === 'string') {
        output[dbColumn] = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
      } else {
        output[dbColumn] = value;
      }
    }
  }

  return output;
}

export function crudRouter(config: ResourceConfig) {
  const router = Router();
  const columns = normalizeFields(config.fields);
  const table = config.table
    .split('.')
    .map((part) => quoteIdent(part))
    .join('.');
  const idColumn = quoteIdent(config.idColumn);

  router.get('/', async (req, res, next) => {
    try {
      const params: unknown[] = [];
      const where: string[] = [];

      if (config.parentColumn) {
        params.push(Number(req.query.parentId));
        where.push(`${quoteIdent(config.parentColumn)} = $${params.length}`);
      }

      if (req.query.search && config.searchable?.length) {
        params.push(`%${String(req.query.search).toLowerCase()}%`);
        const clauses = config.searchable.map((column) => `lower(coalesce(${quoteIdent(column)}::text, '')) like $${params.length}`);
        where.push(`(${clauses.join(' or ')})`);
      }

      const sql = `select * from ${table}${where.length ? ` where ${where.join(' and ')}` : ''} order by ${idColumn} desc`;
      const result = await query<Record<string, unknown>>(sql, params);
      res.json(result.rows.map((row) => serializeRow(row, columns, config.idColumn)));
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const data = sanitizeBody(req.body, columns, config.booleanColumns);
      if (config.parentColumn && req.query.parentId) data[config.parentColumn] = Number(req.query.parentId);
      const dataColumns = Object.keys(data);

      if (!dataColumns.length) {
        res.status(400).json({ message: 'No valid fields supplied.' });
        return;
      }

      const values = dataColumns.map((column) => data[column]);
      const placeholders = dataColumns.map((_, index) => `$${index + 1}`);
      const result = await query<Record<string, unknown>>(
        `insert into ${table} (${dataColumns.map(quoteIdent).join(', ')}) values (${placeholders.join(', ')}) returning *`,
        values
      );
      res.status(201).json(serializeRow(result.rows[0], normalizeFields(config.fields), config.idColumn));
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const data = sanitizeBody(req.body, columns, config.booleanColumns);
      const dataColumns = Object.keys(data);

      if (!dataColumns.length) {
        res.status(400).json({ message: 'No valid fields supplied.' });
        return;
      }

      const assignments = dataColumns.map((column, index) => `${quoteIdent(column)} = $${index + 1}`);
      const values = dataColumns.map((column) => data[column]);
      values.push(Number(req.params.id));

      const result = await query<Record<string, unknown>>(
        `update ${table} set ${assignments.join(', ')} where ${idColumn} = $${values.length} returning *`,
        values
      );

      if (!result.rowCount) {
        res.status(404).json({ message: 'Record not found.' });
        return;
      }

      res.json(serializeRow(result.rows[0], normalizeFields(config.fields), config.idColumn));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const result = await query(`delete from ${table} where ${idColumn} = $1`, [Number(req.params.id)]);
      if (!result.rowCount) {
        res.status(404).json({ message: 'Record not found.' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export function joinedCrudRouter(config: JoinConfig) {
  const router = Router();
  const columns = config.columns;
  const table = config.table
    .split('.')
    .map((part) => quoteIdent(part))
    .join('.');
  const idColumn = quoteIdent(config.idColumn);

  router.get('/', async (req, res, next) => {
    try {
      const params: unknown[] = [];
      const where: string[] = [];
      if (config.parentColumn) {
        params.push(Number(req.query.parentId));
        where.push(`${quoteIdent(config.parentColumn)} = $${params.length}`);
      }
      const result = await query<Record<string, unknown>>(
        `select * from ${table}${where.length ? ` where ${where.join(' and ')}` : ''} order by ${idColumn} desc`,
        params
      );
      res.json(result.rows.map((row) => serializeRow(row, columns, config.idColumn)));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
