import fetch from 'node-fetch';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';
import AboutClient from './about.js'

/**
 * Client for GeoServer layers
 *
 * @module LayerClient
 */
export default class LayerGroupClient {
  /**
   * Creates a GeoServer REST LayerClient instance.
   *
   * @param {String} url The URL of the GeoServer REST API endpoint
   * @param {String} auth The Basic Authentication string
   */
  constructor (url, auth) {
    this.url = url;
    this.auth = auth;
  }

  /**
   * Returns a GeoServer layergroup by the given workspace and layergroup name,
   * e.g. "myWs:myLayer".
   *
   * @param {String} workspace The name of the workspace
   * @param {String} layerGroupName The name of the layer to query
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with layer information or undefined if it cannot be found
   */
  async get (workspace, layerGroupName) {
    const response = await fetch(
      `${this.url}/workspaces/${workspace}/layergroups/${layerGroupName}.json`, {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: this.auth
        }
      });

    if (!response.ok) {
      const grc = new AboutClient(this.url, this.auth);
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

  async modify (workspace, layerGroupName, jsonBody) {
    const url = `${this.url}/workspaces/${workspace}/layergroups/${layerGroupName}.json`;
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonBody)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }
}
