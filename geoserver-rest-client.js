import fetch from 'node-fetch';
import LayerClient from './src/layer.js';
import StyleClient from './src/style.js';
import WorkspaceClient from './src/workspace.js';
import DatastoreClient from './src/datastore.js';
import ImageMosaicClient from './src/imagemosaic.js';
import SecurityClient from './src/security.js';

/**
 * Client for GeoServer REST API.
 * Has minimal basic functionality and offers REST client instances for
 * sub-entities, like workspaces or datastores as member variables.
 *
 * @module GeoServerRestClient
 */
export default class GeoServerRestClient {
  /**
   * Creates a GeoServerRestClient instance.
   *
   * @param {String} url The URL of the GeoServer REST API endpoint
   * @param {String} user The user for the GeoServer REST API
   * @param {String} password The password for the GeoServer REST API
   */
  constructor (url, user, password) {
    this.url = url.endsWith('/') ? url : url + '/';
    this.user = user;
    this.password = password;

    /** @member {LayerClient} layers GeoServer REST client instance for layers */
    this.layers = new LayerClient(this.url, this.user, this.password);
    /** @member {StyleClient} styles GeoServer REST client instance for styles */
    this.styles = new StyleClient(this.url, this.user, this.password);
    /** @member {WorkspaceClient} workspaces GeoServer REST client instance for workspaces */
    this.workspaces = new WorkspaceClient(this.url, this.user, this.password);
    /** @member {DatastoreClient} datastores GeoServer REST client instance for data stores */
    this.datastores = new DatastoreClient(this.url, this.user, this.password);
    /** @member {ImageMosaicClient} imagemosaics GeoServer REST client instance for image mosaics */
    this.imagemosaics = new ImageMosaicClient(this.url, this.user, this.password);
    /** @member {SecurityClient} security GeoServer REST client instance for security related modifications */
    this.security = new SecurityClient(this.url, this.user, this.password);
  }

  /**
   * Returns the version information.
   */
  async getVersion () {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'about/version.json', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });
      return await response.json();
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if the configured GeoServer REST connection exists.
   */
  async exists () {
    try {
      const versionInfo = await this.getVersion();
      if (versionInfo) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }
}
