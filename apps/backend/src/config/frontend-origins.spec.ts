import { resolveFrontendOrigins } from './frontend-origins';

describe('resolveFrontendOrigins', () => {
  it('returns a single origin as a string', () => {
    expect(resolveFrontendOrigins('http://localhost:3000')).toBe('http://localhost:3000');
  });

  it('strips a trailing slash, which would never match an Origin header', () => {
    // The value pasted from a browser address bar, and the exact bug seen in
    // production when FRONTEND_URL ended in "/".
    expect(resolveFrontendOrigins('https://dh-araria.vercel.app/')).toBe(
      'https://dh-araria.vercel.app'
    );
  });

  it('strips whitespace around a comma-separated list', () => {
    expect(
      resolveFrontendOrigins(' https://dh-araria.vercel.app/ , http://localhost:3000/ ')
    ).toEqual(['https://dh-araria.vercel.app', 'http://localhost:3000']);
  });

  it('drops a path, query or fragment from a pasted URL', () => {
    expect(resolveFrontendOrigins('https://dh-araria.vercel.app/feedback?utm=1')).toBe(
      'https://dh-araria.vercel.app'
    );
  });

  it('lowercases the host, as browsers do', () => {
    expect(resolveFrontendOrigins('https://DH-Araria.Vercel.App')).toBe(
      'https://dh-araria.vercel.app'
    );
  });

  it('removes duplicate entries', () => {
    expect(
      resolveFrontendOrigins('https://dh-araria.vercel.app,https://dh-araria.vercel.app/')
    ).toBe('https://dh-araria.vercel.app');
  });

  it('keeps a non-URL value such as a wildcard', () => {
    expect(resolveFrontendOrigins('*')).toBe('*');
  });

  it('ignores empty entries instead of producing an empty allowlist entry', () => {
    expect(resolveFrontendOrigins('https://dh-araria.vercel.app,,')).toBe(
      'https://dh-araria.vercel.app'
    );
  });
});
