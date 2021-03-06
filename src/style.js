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
   * @returns {Object|Boolean} An object with the default styles or 'false'
   */
  async getDefaults () {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'styles.json', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });

      if (response.status === 200) {
        return await response.json();
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns all styles in a workspace.
   *
   * @param {String} workspace Workspace name to get styles for
   *
   * @returns {Object|Boolean} An object with all styles or 'false'
   */
  async getInWorkspace (workspace) {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces/' + workspace + '/styles.json', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });

      if (response.status === 200) {
        return await response.json();
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns all styles defined in workspaces.
   *
   * @returns {Object|Boolean} An object with all styles or 'false'
   */
  async getAllWorkspaceStyles () {
    try {
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
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns all styles as combined object (default ones and those in
   * workspaces).
   *
   * @returns {Object|Boolean} An object with all styles or 'false'
   */
  async getAll () {
    try {
      const defaultStyles = await this.getDefaults();
      const wsStyles = await this.getAllWorkspaceStyles();
      const allStyles = defaultStyles.styles.style.concat(wsStyles);

      return allStyles;
    } catch (error) {
      return false;
    }
  }

  /**
   * Publishes a new SLD style.
   *
   * @param {String} workspace The workspace to publish style in
   * @param {String} name Name of the style
   * @param {String} sldBody SLD style (as XML text)
   *
   * @returns {Boolean} If the style could be published
   */
  async publish (workspace, name, sldBody) {
    try {
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

      if (response.status === 201) {
        return true;
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Assigns a style to a layer.
   *
   * @param {String} qualifiedName GeoServer layer name with workspace prefix
   * @param {String} styleName The name of the style
   * @param {String} [workspaceStyle] The workspace of the style
   * @param {Boolean} [isDefaultStyle=true] If the style should be the default style of the layer
   *
   * @returns {Boolean} If the style could be assigned
   */
  async assignStyleToLayer (qualifiedName, styleName, workspaceStyle, isDefaultStyle) {
    try {
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

      if (response.status === 201) {
        return true;
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get information about a style.
   *
   * @param {String} styleName The name of the style
   * @param {String} [workspace] The name of the workspace
   *
   * @returns {Object|Boolean} An object about the style or 'false'
   */
  async getStyleInformation (styleName, workspace) {
    try {
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

      if (response.status === 200) {
        return await response.json();
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }
}
