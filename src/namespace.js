import fetch from 'node-fetch';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';

/**
 * Client for GeoServer namespace
 *
 * @module NamespaceClient
 */
export default class NamespaceClient {
  /**
   * Creates a GeoServer REST NamespaceClient instance.
   *
   * @param {String} url The URL of the GeoServer REST API endpoint
   * @param {String} user The user for the GeoServer REST API
   * @param {String} password The password for the GeoServer REST API
   */
  constructor (url, auth) {
    this.url = url.endsWith('/') ? url : url + '/';
    this.auth = auth;
  }

  /**
   * Returns all namespaces.
   *
   * @throws Error if request fails
   *
   * @returns {Object|Boolean} An object describing the namespace or 'false'
   */
  async getAll () {
    const response = await fetch(this.url + 'namespaces.json', {
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
    return await response.json();
  }

  /**
   * Creates a new namespace.
   *
   * @param {String} prefix Prefix of the new namespace
   * @param {String} uri Uri of the new namespace
   *
   * @throws Error if request fails
   *
   * @returns {String} The name of the created namespace
   */
  async create (prefix, uri) {
    const body = {
      namespace: {
        prefix: prefix,
        uri: uri
      }
    };

    const response = await fetch(this.url + 'namespaces', {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }

    return await response.text();
  }

  /**
   * Returns a namespace.
   *
   * @param {String} name Name of the namespace
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object describing the namespace
   */
  async get (name) {
    const response = await fetch(this.url + 'namespaces/' + name + '.json', {
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
    return await response.json();
  }

  /**
   * Deletes a namespace.
   *
   * @param {String} name Name of the namespace to delete
   *
   * @throws Error if request fails
   *
   * @returns {Boolean} If deletion was successful
   */
  async delete (name) {
    const response = await fetch(this.url + 'namespaces/' + name, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: this.auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      switch (response.status) {
        case 200:
          return true;
        case 403:
          throw new GeoServerResponseError(
            'Namespace or related Workspace is not empty (and recurse not true)',
            geoServerResponse);
        case 404:
          throw new GeoServerResponseError('Namespace doesn’t exist', geoServerResponse);
        case 405:
          throw new GeoServerResponseError('Can’t delete default namespace', geoServerResponse);
        default:
          throw new GeoServerResponseError('Response not recognised', geoServerResponse)
      }
    }

    return true;
  }
}
