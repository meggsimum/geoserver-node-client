import fetch from 'node-fetch';
import { GeoServerResponseError } from './util/geoserver.js';

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
     * @param {String} user The user for the GeoServer REST API
     * @param {String} password The password for the GeoServer REST API
     */
  constructor (url, user, password) {
    this.url = url.endsWith('/') ? url : url + '/';
    this.user = user;
    this.password = password;
  }

  /**
     * Get the GeoServer version.
     *
     * @throws Error if request fails
     *
     * @returns {Object} The version of GeoServer
     */
  async getVersion () {
    const auth =
            Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'about/version.json';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      throw new GeoServerResponseError();
    }
    return await response.json();
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
