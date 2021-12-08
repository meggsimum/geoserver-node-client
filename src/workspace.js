import fetch from 'node-fetch';
import { GeoServerResponseError } from './errors.js';

/**
 * Client for GeoServer workspaces
 *
 * @module WorkspaceClient
 */
export default class WorkspaceClient {
  /**
   * Creates a GeoServer REST WorkspaceClient instance.
   *
   * WARNING: For most cases the 'NameSpaceClient' seems to fit better.
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
   * Returns all workspaces.
   *
   * @throws Error if request fails
   *
   * @returns {Object} An Object describing the workspaces
   */
  async getAll () {
    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'workspaces.json', {
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
   * Returns a workspace.
   *
   * @param {String} name Name of the workspace
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object describing the workspaces
   */
  async get (name) {
    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'workspaces/' + name + '.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });
    if (!response.ok) {
      switch (response.status) {
        case 404:
          throw new Error('workspace does not exist');
        default:
          throw new Error('Response not recognised')
      }
    }
    return await response.json();
  }

  /**
   * Creates a new workspace.
   *
   * @param {String} name Name of the new workspace
   *
   * @throws Error if request fails
   *
   * @returns {String} The name of the created workspace
   */
  async create (name) {
    const body = {
      workspace: {
        name: name
      }
    };

    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');

    const response = await fetch(this.url + 'workspaces', {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      switch (response.status) {
        case 409:
          throw new Error('Unable to add workspace as it already exists');
        default:
          throw new Error('Response not recognised')
      }
    }

    return await response.text();
  }

  /**
   * Deletes a workspace.
   *
   * @param {String} name Name of the workspace to delete
   * @param {Boolean} recurse Flag to enable recursive deletion
   *
   * @throws Error if request fails
   *
   * @returns {Boolean} If deletion was successful
   */
  async delete (name, recurse) {
    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'workspaces/' + name + '?recurse=' + recurse, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      switch (response.status) {
        case 400:
          // the docs say code 403, but apparently it is code 400
          // https://docs.geoserver.org/latest/en/api/#1.0.0/workspaces.yaml
          throw new Error('Workspace or related Namespace is not empty (and recurse not true)');
        case 404:
          throw new Error('Workspace doesn’t exist');
        default:
          throw new Error('Response not recognised')
      }
    }
    return true;
  }
}
