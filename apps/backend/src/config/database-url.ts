/**
 * Single source of truth for the database connection.
 *
 * `DATABASE_URL` is the canonical configuration. The discrete `DB_*` variables
 * survive only as explicit overrides for the local docker-compose PostgreSQL
 * container, where a URL is more awkward than five plain values.
 *
 * Both Drizzle (`DrizzleService`) and MikroORM (`createMikroOrmConfig`) resolve
 * their pool through this function, so the two clients can never disagree about
 * host, credentials, or TLS — the failure mode that existed when Prisma read
 * `DATABASE_URL` while the other two read `DB_*`.
 */

export interface DatabaseConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'postgres']);

/** `sslmode` values that require TLS, per the libpq connection-string spec. */
const SSL_MODES_REQUIRING_TLS = new Set(['require', 'verify-ca', 'verify-full', 'prefer', 'allow']);

function parseUrl(url: string): Partial<DatabaseConnection> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      'DATABASE_URL is not a valid PostgreSQL connection string. ' +
        'Expected postgresql://user:password@host:port/database'
    );
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error(
      `DATABASE_URL must use the postgresql:// or postgres:// scheme, got "${parsed.protocol}".`
    );
  }

  // `new URL` leaves percent-encoding in place, so decode credentials that
  // contain reserved characters.
  const decode = (value: string): string => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const sslMode = parsed.searchParams.get('sslmode');
  const sslFromUrl =
    sslMode === null ? undefined : SSL_MODES_REQUIRING_TLS.has(sslMode.toLowerCase());

  return {
    host: parsed.hostname || undefined,
    port: parsed.port ? parseInt(parsed.port, 10) : undefined,
    user: parsed.username ? decode(parsed.username) : undefined,
    password: parsed.password ? decode(parsed.password) : undefined,
    database: parsed.pathname.replace(/^\//, '') || undefined,
    ssl: sslFromUrl,
  };
}

export function resolveDatabaseConnection(
  env: NodeJS.ProcessEnv = process.env
): DatabaseConnection {
  const fromUrl = env.DATABASE_URL ? parseUrl(env.DATABASE_URL) : {};

  // Explicit DB_* values win over the URL, which is what makes the local
  // docker-compose container work while a managed URL stays in .env.
  const host = env.DB_HOST ?? fromUrl.host ?? 'localhost';
  const port = env.DB_PORT ? parseInt(env.DB_PORT, 10) : (fromUrl.port ?? 5432);
  const user = env.DB_USERNAME ?? fromUrl.user ?? 'postgres';
  const password = env.DB_PASSWORD ?? fromUrl.password ?? 'postgres';
  const database = env.DB_NAME ?? fromUrl.database ?? 'dh_araria';

  // Precedence: explicit DB_SSL > sslmode in the URL > non-local host implies TLS.
  // Managed providers (Supabase, Neon, RDS) require TLS; a local container does not.
  const ssl =
    env.DB_SSL !== undefined ? env.DB_SSL === 'true' : (fromUrl.ssl ?? !LOCAL_HOSTS.has(host));

  return { host, port, user, password, database, ssl };
}

/** TLS options in the shape `pg` expects, or undefined when TLS is off. */
export function tlsOptions(ssl: boolean): { rejectUnauthorized: false } | undefined {
  return ssl ? { rejectUnauthorized: false } : undefined;
}

/**
 * Connection used by schema tooling (drizzle-kit, `db:migrate`).
 *
 * Supabase exposes two endpoints for the same database: a transaction pooler
 * (port 6543) for application traffic and a direct/session connection (port
 * 5432) for DDL. Migrations and `drizzle-kit` must use the direct one — DDL
 * through a transaction pooler fails or leaks session state. Set
 * `DATABASE_MIGRATION_URL` to the direct URL; it falls back to `DATABASE_URL`
 * so local development needs one variable.
 */
export function resolveMigrationConnection(
  env: NodeJS.ProcessEnv = process.env
): DatabaseConnection {
  const url = env.DATABASE_MIGRATION_URL ?? env.DATABASE_URL;
  return resolveDatabaseConnection({ ...env, DATABASE_URL: url });
}

/**
 * True when the process is a short-lived function instance. Both Vercel and
 * AWS Lambda set a marker; the pool defaults shrink so N instances cannot
 * exhaust the database's connection limit.
 */
export function isServerlessRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME || env.FUNCTION_NAME);
}
