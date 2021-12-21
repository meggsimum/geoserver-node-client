import fetch from 'node-fetch';
import WorkspaceClient from './workspace.js';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';
import AboutClient from './about.js'

/**
 * Client for GeoServer styles
 *
 * @module StyleClient
 */
export default class StyleClient {
  /**
   * Creates a GeoServer REST StyleClient instance.
   *
   * @param {String} url The URL of the GeoServer REST API endpoint
   * @param {String} auth The Basic Authentication string
   */
   constructor (url, auth) {
    this.url = url;
    this.auth = auth;
  }

  /**
   * Returns all default styles.
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with the default styles
   */
  async getDefaults () {
    const response = await fetch(this.url + 'styles.json', {
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
   * Returns all styles in a workspace.
   *
   * @param {String} workspace Workspace name to get styles for
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with all styles
   */
  async getInWorkspace (workspace) {
    const response = await fetch(this.url + 'workspaces/' + workspace + '/styles.json', {
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
   * Returns all styles defined in workspaces.
   *
   * @throws Error if request fails
   *
   * @returns {Object[]} An array with all style objects
   */
  async getAllWorkspaceStyles () {
    const allStyles = [];
    const ws = new WorkspaceClient(this.url, this.auth);
    const allWs = await ws.getAll();

    // go over all workspaces and query the styles for
    for (let i = 0; i < allWs.workspaces.workspace.length; i++) {
      const ws = allWs.workspaces.workspace[i];
      const wsStyles = await this.getInWorkspace(ws.name);

      if (wsStyles.styles.style) {
        wsStyles.styles.style.forEach(wsStyle => {
          allStyles.push(wsStyle);
        });
      }
    }

    return allStyles;
  }

  /**
   * Returns all styles as combined object (default ones and those in
   * workspaces).
   *
   * @returns {Object[]} An array with all style objects
   */
  async getAll () {
    const defaultStyles = await this.getDefaults();
    const wsStyles = await this.getAllWorkspaceStyles();
    const allStyles = defaultStyles.styles.style.concat(wsStyles);

    return allStyles;
  }

  /**
   * Publishes a new SLD style.
   *
   * @param {String} workspace The workspace to publish the style in
   * @param {String} name Name of the style
   * @param {String} sldBody SLD style (as XML text)
   *
   * @throws Error if request fails
   *
   * @returns {Boolean} If the style could be published
   */
  async publish (workspace, name, sldBody) {
    const response = await fetch(this.url + 'workspaces/' + workspace + '/styles?name=' + name, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/vnd.ogc.sld+xml'
      },
      body: sldBody
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return true;
  }

  /**
   * Deletes a style.
   *
   * @param {String} workspace The name of the workspace, can be undefined if style is not assigned to a workspace
   * @param {String} name The name of the style to delete
   * @param {Boolean} [recurse=false] If references to the specified style in existing layers should be deleted
   * @param {Boolean} [purge=false] Whether the underlying file containing the style should be deleted on disk
   *
   * @returns {Boolean} If the style could be deleted
   */
  async delete (workspace, name, recurse, purge) {
    let paramPurge = false;
    let paramRecurse = false;

    if (purge === true) {
      paramPurge = true;
    }
    if (recurse === true) {
      paramRecurse = true;
    }

    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    let endpoint;

    if (workspace) {
      // delete style inside workspace
      endpoint = this.url + 'workspaces/' + workspace + '/styles/' + name +
                  '?' + 'purge=' + paramPurge + '&' + 'recurse=' + paramRecurse;
    } else {
      // delete style without workspace
      endpoint = this.url + 'styles/' + name +
                  '?' + 'purge=' + paramPurge + '&' + 'recurse=' + paramRecurse;
    }

    const response = await fetch(endpoint, {
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
            'Deletion failed. There might be dependant layers to this style. Delete them first or call this with "recurse=false"',
            geoServerResponse
          );
        default:
          throw new GeoServerResponseError('Requesting GeoServer failed:' + await response.text());
      }
    }

    return true;
  }

  /**
   * Assigns a style to a layer.
   *
   * @param {String} qualifiedName GeoServer layer name with workspace prefix
   * @param {String} styleName The name of the style
   * @param {String} [workspaceStyle] The workspace of the style
   * @param {Boolean} [isDefaultStyle=true] If the style should be the default style of the layer
   *
   * @throws Error if request fails
   *
   * @returns {Boolean} If the style could be assigned
   */
  async assignStyleToLayer (qualifiedName, styleName, workspaceStyle, isDefaultStyle) {
    const styleBody = await this.getStyleInformation(styleName, workspaceStyle);

    const response = await fetch(this.url + 'layers/' + qualifiedName + '/styles?default=' + isDefaultStyle, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(styleBody)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return true;
  }

  /**
   * Get information about a style.
   *
   * @param {String} styleName The name of the style
   * @param {String} [workspace] The name of the workspace
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object about the style or undefined if it cannot be found
   */
  async getStyleInformation (styleName, workspace) {
    let url;
    if (workspace) {
      url = this.url + 'workspaces/' + workspace + '/styles/' + styleName + '.json';
    } else {
      url = this.url + 'styles/' + styleName + '.json';
    }

    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: this.auth
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
    return await response.json();
  }
}
