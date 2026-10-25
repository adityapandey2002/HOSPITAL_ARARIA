/**
 * Turn the `FRONTEND_URL` value into the exact strings a browser will send in
 * its `Origin` header.
 *
 * A CORS allowlist is compared byte-for-byte with the request's origin, and an
 * origin has no trailing slash and no path. A value pasted from a browser
 * address bar — `https://dh-araria.vercel.app/` — therefore never matches, and
 * the failure is invisible server-side: the response simply lacks the header
 * and the browser blocks the call.
 *
 * Normalising here means a stray slash, surrounding whitespace, a duplicated
 * entry or a copied full URL all behave the way the operator intended.
 */
export function resolveFrontendOrigins(value: string): string | string[] {
  const origins = value
    .split(',')
    .map((origin) => normaliseOrigin(origin))
    .filter(Boolean);

  const unique = [...new Set(origins)];

  return unique.length > 1 ? unique : unique[0];
}

function normaliseOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    // `.origin` drops the path, query, fragment and trailing slash, and
    // lowercases the host — exactly what the browser sends.
    return new URL(trimmed).origin;
  } catch {
    // Not a URL we can parse (e.g. "*"). Leave it untouched rather than
    // guessing; an unparseable entry simply will not match any request.
    return trimmed.replace(/\/+$/, '');
  }
}
