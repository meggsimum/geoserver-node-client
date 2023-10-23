import fetch from 'node-fetch';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';
import AboutClient from './about.js'

/**
 * Client for GeoServer layergroups
 *
 * @module LayerClient
 */
export default class LayerGroupClient {
  /**
   * Creates a GeoServer REST LayerGroupClient instance.
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
   * e.g. "myWs:myLayergroup".
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

  /**
   * Modifies an existing GeoServer layergroup
   *
   * @param {String} workspace The name of the workspace
   * @param {String} layerName The name of the layergroup to modify
   * @param {Object} layerGroupDefinition The modified definiton of the layergroup
   *
   * @throws Error if request fails
   */
  async modify (workspace, layerGroupName, layerGroupDefinition) {
    const url = `${this.url}/workspaces/${workspace}/layergroups/${layerGroupName}.json`;
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(layerGroupDefinition)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }
}
