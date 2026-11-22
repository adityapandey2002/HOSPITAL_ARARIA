/** Minimal database surface. Satisfied by `pg.PoolClient` and by PGlite in tests. */
export interface QueryResult<T> {
  rows: T[];
}

export interface Queryable {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}
