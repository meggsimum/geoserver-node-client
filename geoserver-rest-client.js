import LayerClient from './src/layer.js';
import StyleClient from './src/style.js';
import WorkspaceClient from './src/workspace.js';
import DatastoreClient from './src/datastore.js';
import ImageMosaicClient from './src/imagemosaic.js';
import SecurityClient from './src/security.js';
import SettingsClient from './src/settings.js';
import NamespaceClient from './src/namespace.js';
import AboutClient from './src/about.js';

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
    /** @member {NamespaceClient} namespaces GeoServer REST client instance for namespaces */
    this.namespaces = new NamespaceClient(this.url, this.user, this.password);
    /** @member {DatastoreClient} datastores GeoServer REST client instance for data stores */
    this.datastores = new DatastoreClient(this.url, this.user, this.password);
    /** @member {ImageMosaicClient} imagemosaics GeoServer REST client instance for image mosaics */
    this.imagemosaics = new ImageMosaicClient(this.url, this.user, this.password);
    /** @member {SecurityClient} security GeoServer REST client instance for security related modifications */
    this.security = new SecurityClient(this.url, this.user, this.password);
    /** @member {SettingsClient} settings GeoServer REST client instance for settings */
    this.settings = new SettingsClient(this.url, this.user, this.password);
    /** @member {AboutClient} about GeoServer REST client instance for about endpoint */
    this.about = new AboutClient(this.url, this.user, this.password);
  }
}
