import fetch from 'node-fetch';

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
   * @returns {Object|Boolean} An object describing the namespace or 'false'
   */
  async getAll () {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'namespaces.json', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });
      const json = await response.json();
      return json;
    } catch (error) {
      return false;
    }
  }

  /**
   * Creates a new namespace.
   *
   * @param {String} prefix Prefix of the new namespace
   * @param {String} uri Uri of the new namespace
   *
   * @returns {String|Boolean} The name of the created namespace or 'false'
   */
  async create (prefix, uri) {
    try {
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

      if (response.status === 201) {
        const responseText = await response.text();
        return responseText;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns a namespace.
   *
   * @param {String} name Name of the namespace
   * @returns {Object|Boolean} An object describing the namespace or 'false'
   */
  async get (name) {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'namespaces/' + name + '.json', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });
      if (response.status === 200) {
        return await response.json();
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Deletes a namespace.
   *
   * @param {String} name Name of the namespace to delete
   *
   * @returns {Boolean} If deletion was successful
   */
  async delete (name) {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'namespaces/' + name, {
        credentials: 'include',
        method: 'DELETE',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });

      // TODO map other HTTP status
      if (response.status === 200) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
}
