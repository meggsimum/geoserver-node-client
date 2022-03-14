import fetch from 'node-fetch';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';
import AboutClient from './about.js'

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
  constructor (url, user, password) {
    this.url = url.endsWith('/') ? url : url + '/';
    this.user = user;
    this.password = password;
  }

  /**
   * Returns all namespaces.
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object describing the namespace
   */
  async getAll () {
    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'namespaces.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });
    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return response.json();
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

    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');

    const response = await fetch(this.url + 'namespaces', {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }

    return response.text();
  }

  /**
   * Returns a namespace.
   *
   * @param {String} name Name of the namespace
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object describing the namespace or undefined if it cannot be found
   */
  async get (name) {
    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'namespaces/' + name + '.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });
    if (!response.ok) {
      const grc = new AboutClient(this.url, this.user, this.password);
      if (await grc.exists()) {
        // GeoServer exists, but requested item does not exist,  we return empty
        return;
      } else {
        // There was a general problem with GeoServer
        const geoServerResponse = await getGeoServerResponseText(response);
        throw new GeoServerResponseError(null, geoServerResponse);
      }
    }
    return response.json();
  }

  /**
   * Deletes a namespace.
   *
   * @param {String} name Name of the namespace to delete
   *
   * @throws Error if request fails
   */
  async delete (name) {
    const auth =
    Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'namespaces/' + name, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      switch (response.status) {
        case 403:
          throw new GeoServerResponseError(
            'Namespace or related Workspace is not empty (and recurse not true)',
            geoServerResponse);
        case 404:
          throw new GeoServerResponseError('Namespace doesn\'t exist', geoServerResponse);
        case 405:
          throw new GeoServerResponseError('Can\'t delete default namespace', geoServerResponse);
        default:
          throw new GeoServerResponseError('Response not recognized', geoServerResponse)
      }
    }
  }
}
