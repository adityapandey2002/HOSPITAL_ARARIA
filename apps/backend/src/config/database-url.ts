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

/** Characters that cannot appear in a URL and usually signal a bad paste. */
const SUSPECT_CHARACTERS = /[<>[\]{}"'`\s]/;

/**
 * Values left over from a copy-pasted template.
 *
 * `new URL` accepts `<password>` and `db.YOUR_PROJECT_REF.supabase.co` — it
 * percent-encodes them and hands back a connection that fails authentication
 * later with a message that names neither the variable nor the placeholder.
 * Rejecting them here converts a confusing auth failure into an instruction.
 */
const PLACEHOLDER_PATTERNS = [
  /^<[^>]*>$/, // <password>
  /^\[[^\]]*\]$/, // [YOUR-PASSWORD]
  /YOUR[_-][A-Z0-9_]+/i, // YOUR_PASSWORD, your-project-ref
  /^(changeme|yourpassword)$/i,
];

function assertNotPlaceholder(value: string, variable: string, field: string): void {
  if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
    throw new Error(
      `${variable} still contains a placeholder for the ${field} ("${value}"). ` +
        'Replace it with the real value from Supabase -> Project Settings -> Database -> Connection string.'
    );
  }
}

/**
 * Drop surrounding whitespace and one pair of wrapping quotes.
 *
 * Copying a connection string out of a dashboard very often brings a leading or
 * trailing quote with it. `new URL` rejects that outright, and the resulting
 * message ("not a valid PostgreSQL connection string") sends the operator
 * hunting for a database problem that does not exist. Normalising here means a
 * stray quote is harmless instead of fatal.
 */
export function normaliseConnectionValue(value: string): string {
  const trimmed = value.trim();
  const quoted = /^(['"`])([\s\S]*)\1$/.exec(trimmed);
  return quoted ? quoted[2].trim() : trimmed;
}

/** Mask the password so a diagnostic string is safe to log and paste. */
function redact(connectionString: string): string {
  return connectionString.replace(/:\/\/([^:@/]*):[^@/]*@/, '://$1:****@');
}

function parseUrl(rawValue: string, variable: string): Partial<DatabaseConnection> {
  const value = normaliseConnectionValue(rawValue);
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    const suspects = [...new Set([...value].filter((ch) => SUSPECT_CHARACTERS.test(ch)))];
    throw new Error(
      `${variable} is not a valid PostgreSQL connection string. ` +
        'Expected postgresql://user:password@host:port/database. ' +
        `Received "${redact(value)}"` +
        (suspects.length ? ` containing ${JSON.stringify(suspects)}` : '') +
        '. If the value in .env looks correct, an exported shell variable is overriding it ' +
        `(dotenv never overrides the environment): run "Remove-Item Env:${variable}" in ` +
        `PowerShell or "unset ${variable}" in bash, then retry.`
    );
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error(
      `${variable} must use the postgresql:// or postgres:// scheme, got "${parsed.protocol}".`
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

  const decodedUser = parsed.username ? decode(parsed.username) : undefined;
  const decodedPassword = parsed.password ? decode(parsed.password) : undefined;
  const hostname = parsed.hostname || undefined;
  const database = parsed.pathname.replace(/^\//, '') || undefined;

  if (hostname) assertNotPlaceholder(hostname, variable, 'host');
  if (decodedPassword) assertNotPlaceholder(decodedPassword, variable, 'password');
  if (database) assertNotPlaceholder(database, variable, 'database name');

  return {
    host: hostname,
    port: parsed.port ? parseInt(parsed.port, 10) : undefined,
    user: decodedUser,
    password: decodedPassword,
    database,
    ssl: sslFromUrl,
  };
}

export function resolveDatabaseConnection(
  env: NodeJS.ProcessEnv = process.env,
  variable: 'DATABASE_URL' | 'DATABASE_MIGRATION_URL' = 'DATABASE_URL'
): DatabaseConnection {
  const rawUrl = env[variable];
  const fromUrl = rawUrl ? parseUrl(rawUrl, variable) : {};

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
  // Name the variable in diagnostics: "DATABASE_URL is invalid" is actively
  // misleading when the broken value is DATABASE_MIGRATION_URL.
  const variable = env.DATABASE_MIGRATION_URL ? 'DATABASE_MIGRATION_URL' : 'DATABASE_URL';
  return resolveDatabaseConnection({ ...env, DATABASE_URL: env[variable] }, variable);
}

/**
 * True when the process is a short-lived function instance. Both Vercel and
 * AWS Lambda set a marker; the pool defaults shrink so N instances cannot
 * exhaust the database's connection limit.
 */
export function isServerlessRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.VERCEL || env.AWS_LAMBDA_FUNCTION_NAME || env.FUNCTION_NAME);
}

/**
 * Default connection ceiling for one process.
 *
 * A serverless instance must hold at most one connection per ORM: a few hundred
 * warm instances each opening 20 connections would exhaust any managed
 * Postgres. A long-lived server can hold a real pool.
 *
 * This is a *default*, not a validation constraint. It deliberately lives here
 * rather than in the Joi schema because `@nestjs/config` copies validated
 * defaults into `process.env`, which would make the serverless branch above
 * unreachable.
 */
export function defaultPoolSize(env: NodeJS.ProcessEnv = process.env): number {
  return isServerlessRuntime(env) ? 1 : 20;
}
