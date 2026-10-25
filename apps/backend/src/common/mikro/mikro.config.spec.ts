import { createMikroOrmConfig } from './mikro.config';
import { AuditLog } from './entities/audit-log.entity';
import { AbhaProfile } from '../../modules/abdm/entities/abha-profile.entity';

describe('createMikroOrmConfig', () => {
  const config = createMikroOrmConfig({ connect: false });

  it('registers entities as classes, not file globs', () => {
    // Regression guard. The glob form looked tidy and worked locally, but a
    // glob in a config object is invisible to a bundler's static analysis, and
    // it resolves against process.cwd(). On Vercel that produced
    // "MetadataError: No entities were discovered" at cold start, so every
    // request — including /favicon.ico — returned 500.
    expect(Array.isArray(config.entities)).toBe(true);

    for (const entity of config.entities ?? []) {
      expect(typeof entity).toBe('function');
    }
  });

  it('registers all five tables it owns', () => {
    expect(config.entities).toHaveLength(5);
    expect(config.entities).toEqual(expect.arrayContaining([AuditLog, AbhaProfile]));
  });

  it('does not depend on the working directory', () => {
    const patterns = (config.entities ?? []).filter((entity) => typeof entity === 'string');

    expect(patterns).toEqual([]);
  });
});
