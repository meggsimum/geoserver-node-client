import fetch from 'node-fetch';

/**
 * Client for GeoServer workspaces
 *
 * @module WorkspaceClient
 */
export default class WorkspaceClient {
  /**
   * Creates a GeoServer REST WorkspaceClient instance.
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
   * @returns {Object|Boolean} An Object describing the workspaces or 'false'
   */
  async getAll () {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces.json', {
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
   * Creates a new workspace.
   *
   * @param {String} name Name of the new workspace
   *
   * @returns {String|Boolean} The name of the created workspace or 'false'
   */
  async create (name) {
    try {
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
   * Deletes a workspace.
   *
   * @param {String} name Name of the workspace to delete
   * @param {Boolean} recurse Flag to enable recursive deletion
   * 
   * @returns {Boolean} If Deletion was successful
   */
  async delete (name, recurse) {
    if (!recurse){
      return false;
    }
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces/' + name + '?recurse=' + recurse, {
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
