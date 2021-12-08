/** Collection of custom Error types */

/**
 * Generic GeoServer error
 */
class GeoServerResponseError extends Error {
  constructor (message) {
    super(message)
    this.name = 'GeoServerResponseError';
  }
}

export {
  GeoServerResponseError
}
