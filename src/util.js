/**
 * Utility functions
 */

/**
 * Return the GeoServer response text if available.
 *
 * @param {Response} response The response of the GeoServer
 *
 * @returns {String} The response text if available
 */
async function getGeoServerResponseText (response) {
  try {
    return await response.text()
  } catch {}
}

export {
  getGeoServerResponseText
}
