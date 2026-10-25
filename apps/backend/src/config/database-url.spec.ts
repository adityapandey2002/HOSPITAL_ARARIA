import {
  defaultPoolSize,
  isServerlessRuntime,
  normaliseConnectionValue,
  resolveDatabaseConnection,
  resolveMigrationConnection,
} from './database-url';

const VALID =
  'postgresql://postgres.ref:secret@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';

describe('database-url', () => {
  describe('resolveDatabaseConnection', () => {
    it('reads host, port, credentials and database from the URL', () => {
      const connection = resolveDatabaseConnection({ DATABASE_URL: VALID });

      expect(connection).toEqual({
        host: 'aws-0-ap-northeast-1.pooler.supabase.com',
        port: 6543,
        user: 'postgres.ref',
        password: 'secret',
        database: 'postgres',
        ssl: true,
      });
    });

    it('decodes percent-encoded credentials', () => {
      const connection = resolveDatabaseConnection({
        DATABASE_URL: 'postgresql://postgres.ref:p%40ss%2Fword@db.example.com:5432/postgres',
      });

      expect(connection.user).toBe('postgres.ref');
      expect(connection.password).toBe('p@ss/word');
    });

    it('turns TLS off for a local host', () => {
      const connection = resolveDatabaseConnection({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/dh_araria',
      });

      expect(connection.ssl).toBe(false);
    });

    it('honours an explicit sslmode over the host heuristic', () => {
      const connection = resolveDatabaseConnection({
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/dh_araria?sslmode=require',
      });

      expect(connection.ssl).toBe(true);
    });

    it('lets DB_* overrides win over the URL', () => {
      const connection = resolveDatabaseConnection({
        DATABASE_URL: VALID,
        DB_HOST: 'db.internal',
        DB_PORT: '6432',
        DB_NAME: 'other',
      });

      expect(connection.host).toBe('db.internal');
      expect(connection.port).toBe(6432);
      expect(connection.database).toBe('other');
    });

    it('falls back to local defaults when no URL is set', () => {
      const connection = resolveDatabaseConnection({});

      expect(connection.host).toBe('localhost');
      expect(connection.port).toBe(5432);
      expect(connection.ssl).toBe(false);
    });
  });

  describe('pasted connection strings', () => {
    it.each([
      ['double quotes', `"${VALID}"`],
      ['single quotes', `'${VALID}'`],
      ['surrounding whitespace', `  ${VALID}\r\n`],
      ['quotes and whitespace', ` "${VALID}" `],
    ])('accepts a value wrapped in %s', (_label, value) => {
      const connection = resolveDatabaseConnection({ DATABASE_URL: value });

      expect(connection.host).toBe('aws-0-ap-northeast-1.pooler.supabase.com');
      expect(connection.port).toBe(6543);
    });

    it('does not strip a quote that belongs to the password', () => {
      expect(normaliseConnectionValue('postgresql://u:pa"ss@h:5432/d')).toBe(
        'postgresql://u:pa"ss@h:5432/d'
      );
    });
  });

  describe('error messages', () => {
    it('names DATABASE_URL when that is the broken variable', () => {
      expect(() => resolveDatabaseConnection({ DATABASE_URL: 'nonsense' })).toThrow(
        /DATABASE_URL is not a valid PostgreSQL connection string/
      );
    });

    it('names DATABASE_MIGRATION_URL when that is the broken variable', () => {
      // The old message always said DATABASE_URL, which sent the operator
      // looking at the wrong variable.
      expect(() =>
        resolveMigrationConnection({
          DATABASE_URL: VALID,
          DATABASE_MIGRATION_URL: 'not-a-url',
        })
      ).toThrow(/DATABASE_MIGRATION_URL is not a valid PostgreSQL connection string/);
    });

    it('rejects a leftover <password> placeholder', () => {
      // `new URL` happily percent-encodes this, so without an explicit check the
      // operator gets an authentication error instead of a parse error.
      expect(() =>
        resolveDatabaseConnection({
          DATABASE_URL: 'postgresql://postgres.ref:<password>@host:5432/postgres',
        })
      ).toThrow(/still contains a placeholder for the password/);
    });

    it('rejects a leftover project-reference placeholder in the host', () => {
      expect(() =>
        resolveDatabaseConnection({
          DATABASE_URL: 'postgresql://postgres:pw@db.YOUR_PROJECT_REF.supabase.co:5432/postgres',
        })
      ).toThrow(/placeholder for the host/);
    });

    it('redacts the password and reports the offending characters', () => {
      let message = '';
      try {
        resolveDatabaseConnection({
          DATABASE_URL: 'postgresql://postgres.ref:sup3rs3cret@ho st:5432/postgres',
        });
      } catch (error) {
        message = (error as Error).message;
      }

      expect(message).not.toContain('sup3rs3cret');
      expect(message).toContain('postgres.ref:****@');
      expect(message).toContain('" "');
    });

    it('points at an overriding shell variable', () => {
      expect(() => resolveDatabaseConnection({ DATABASE_URL: 'nonsense' })).toThrow(
        /Remove-Item Env:DATABASE_URL/
      );
    });
  });

  describe('resolveMigrationConnection', () => {
    it('prefers DATABASE_MIGRATION_URL', () => {
      const connection = resolveMigrationConnection({
        DATABASE_URL: 'postgresql://u:p@pooler.example.com:6543/postgres',
        DATABASE_MIGRATION_URL: 'postgresql://u:p@direct.example.com:5432/postgres',
      });

      expect(connection.host).toBe('direct.example.com');
      expect(connection.port).toBe(5432);
    });

    it('falls back to DATABASE_URL when no migration URL is set', () => {
      const connection = resolveMigrationConnection({ DATABASE_URL: VALID });

      expect(connection.host).toBe('aws-0-ap-northeast-1.pooler.supabase.com');
    });
  });

  describe('serverless pool sizing', () => {
    it.each(['VERCEL', 'AWS_LAMBDA_FUNCTION_NAME', 'FUNCTION_NAME'])(
      'detects %s and caps the pool at one connection',
      (marker) => {
        expect(isServerlessRuntime({ [marker]: '1' })).toBe(true);
        expect(defaultPoolSize({ [marker]: '1' })).toBe(1);
      }
    );

    it('allows a real pool on a long-lived server', () => {
      expect(isServerlessRuntime({})).toBe(false);
      expect(defaultPoolSize({})).toBe(20);
    });
  });
});
