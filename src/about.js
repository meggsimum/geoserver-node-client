import fetch from 'node-fetch';
import { GeoServerResponseError, getGeoServerResponseText } from './util/geoserver.js';

/**
 * Client for GeoServer "about" endpoint
 *
 * @module AboutClient
 */
export default class AboutClient {
  /**
   * Creates a GeoServer REST AboutClient instance.
   *
   * @param {String} url The URL of the GeoServer REST API endpoint
   * @param {String} auth The Basic Authentication string
   */
  constructor (url, auth) {
    this.url = url;
    this.auth = auth;
  }

  /**
   * Get the GeoServer version.
   *
   * @throws Error if request fails
   *
   * @returns {Object} The version of GeoServer
   */
  async getVersion () {
    const url = this.url + 'about/version.json';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: this.auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return response.json();
  }

  /**
   * Checks if the configured GeoServer REST connection exists.
   *
   * @returns {Boolean} If the connection exists
   */
  async exists () {
    let versionInfo;
    try {
      versionInfo = await this.getVersion();
      return !!versionInfo
    } catch (error) {
      return false;
    }
  }
}
