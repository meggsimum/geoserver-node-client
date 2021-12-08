import fetch from 'node-fetch';
import WorkspaceClient from './workspace.js';

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
   * @param {String} user The user for the GeoServer REST API
   * @param {String} password The password for the GeoServer REST API
   */
  constructor (url, user, password) {
    this.url = url.endsWith('/') ? url : url + '/';
    this.user = user;
    this.password = password;
  }

  /**
   * Returns all default styles.
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with the default styles
   */
  async getDefaults () {
    const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'styles.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      throw new Error('Error requesting url:', await response.text());
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
    const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'workspaces/' + workspace + '/styles.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      throw new Error('Error requesting url:', await response.text());
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
    const ws = new WorkspaceClient(this.url, this.user, this.password);
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
   * @param {String} workspace The workspace to publish style in
   * @param {String} name Name of the style
   * @param {String} sldBody SLD style (as XML text)
   *
   * @throws Error if request fails
   *
   * @returns {Boolean} If the style could be published
   */
  async publish (workspace, name, sldBody) {
    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'workspaces/' + workspace + '/styles?name=' + name, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/vnd.ogc.sld+xml'
      },
      body: sldBody
    });

    if (!response.ok) {
      throw new Error('Error requesting url:', await response.text());
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
    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');

    const styleBody = await this.getStyleInformation(styleName, workspaceStyle);

    const response = await fetch(this.url + 'layers/' + qualifiedName + '/styles?default=' + isDefaultStyle, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(styleBody)
    });

    if (!response.ok) {
      throw new Error('Error requesting url:', await response.text());
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
   * @returns {Object} An object about the style
   */
  async getStyleInformation (styleName, workspace) {
    const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');

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
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      throw new Error('Error requesting url:', await response.text());
    }
    return await response.json();
  }
}
