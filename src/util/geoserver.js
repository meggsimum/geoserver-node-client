/**
 * Utility functions and classes
 */

/**
 * Helper to perform HTTP POST with native fetch API.
 *
 * @param {String} url
 * @param {Object} options
 * @returns The native fetch response
 */
async function httpPost(url, options = {}) {
  const { body, ...additionalOptions } = options;
  return fetch(url, {
    credentials: 'include',
    method: 'POST',
    duplex: 'half',
    body,
    ...additionalOptions
  });
}

/**
 * Helper to perform HTTP PUT with native fetch API.
 *
 * @param {String} url
 * @param {Object} options
 * @returns The native fetch response
 */
async function httpPut(url, options = {}) {
  const { body, ...additionalOptions } = options;
  return fetch(url, {
    credentials: 'include',
    method: 'PUT',
    duplex: 'half',
    body,
    ...additionalOptions
  });
}

/**
 * Return the GeoServer response text if available.
 *
 * @param {Response} response The response of the GeoServer
 *
 * @returns {String} The response text if available
 */
async function getGeoServerResponseText(response) {
  try {
    return response.text();
    // eslint-disable-next-line
  } catch (e) {
    // return nothing
  }
}

/**
 * Generic GeoServer error
 */
class GeoServerResponseError extends Error {
  /**
   * @param {String} [message=GeoServer Response Error] The error message
   * @param {String} [geoServerOutput] The error output from GeoServer (useful for debugging)
   */
  constructor(message, geoServerOutput) {
    super(message);
    this.name = 'GeoServerResponseError';
    this.message = message || 'GeoServer Response Error';

    // custom property as explained here: https://xjamundx.medium.com/custom-javascript-errors-in-es6-aa891b173f87
    this.geoServerOutput = geoServerOutput;
  }
}

export { httpPost, httpPut, getGeoServerResponseText, GeoServerResponseError };
