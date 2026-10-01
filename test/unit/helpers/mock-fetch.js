/* global Response:false */

/**
 * Replaces the global `fetch` with a stub for unit tests.
 *
 * `handler(call)` is called for every request and returns
 * `{ status = 200, body = {}, headers = {} }`. A string body is sent as is,
 * everything else is serialized as JSON. Because many client methods issue a
 * follow-up request to `about/version.json` (see `AboutClient.exists()`), the
 * handler usually has to distinguish requests by URL.
 *
 * @param {Function} handler Gets `{ url, method, headers, body }`
 * @returns {{ calls: Object[], restore: Function }}
 */
export function mockFetch(handler) {
  const original = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (input, init = {}) => {
    const call = {
      url: String(input),
      method: init.method ?? 'GET',
      headers: init.headers ?? {},
      body: init.body,
      init
    };
    calls.push(call);

    const { status = 200, body = {}, headers = {} } = handler(call);
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    const noContent = status === 204 || status === 205;

    return new Response(noContent ? null : text, { status, headers });
  };

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    }
  };
}

/** Handler: GeoServer is reachable, but every other resource is unknown. */
export const geoServerUpButNotFound = (call) =>
  call.url.endsWith('about/version.json') ? { body: { about: {} } } : { status: 404 };

/** Handler: GeoServer is down. */
export const geoServerDown = () => ({ status: 503, body: 'Service Unavailable' });
