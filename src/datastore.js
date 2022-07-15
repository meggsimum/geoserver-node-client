import fetch from 'node-fetch';
import fs from 'fs';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';
import AboutClient from './about.js'

/**
 * Client for GeoServer data stores
 *
 * @module DatastoreClient
 */
export default class DatastoreClient {
  /**
   * Creates a GeoServer REST DatastoreClient instance.
   *
   * @param {String} url The URL of the GeoServer REST API endpoint
   * @param {String} auth The Basic Authentication string
   */
  constructor (url, auth) {
    this.url = url;
    this.auth = auth;
  }

  /**
   * Get all DataStores in a workspace.
   *
   * @param {String} workspace The workspace to get DataStores for
   *
   * @returns {Object} An object containing store details
   */
  async getDataStores (workspace) {
    return this.getStores(workspace, 'datastores');
  }

  /**
   * Get all CoverageStores in a workspace.
   *
   * @param {String} workspace The workspace to get CoverageStores for
   *
   * @returns {Object} An object containing store details
   */
  async getCoverageStores (workspace) {
    return this.getStores(workspace, 'coveragestores');
  }

  /**
   * Get all WmsStores in a workspace.
   *
   * @param {String} workspace The workspace to get WmsStores for
   *
   * @returns {Object} An object containing store details
   */
  async getWmsStores (workspace) {
    return this.getStores(workspace, 'wmsstores');
  }

  /**
   * Get all WmtsStores in a workspace.
   *
   * @param {String} workspace The workspace to get WmtsStores for
   *
   * @returns {Object} An object containing store details
   */
  async getWmtsStores (workspace) {
    return this.getStores(workspace, 'wmtsstores');
  }

  /**
   * @private
   * Get information about various store types in a workspace.
   *
   * @param {String} workspace The workspace name
   * @param {String} storeType The type of store
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object containing store details or undefined if it cannot be found
   */
  async getStores (workspace, storeType) {
    const response = await fetch(this.url + 'workspaces/' + workspace + '/' + storeType + '.json', {
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
    return response.json();
  }

  /**
   * Get specific DataStore by name in a workspace.
   *
   * @param {String} workspace The workspace to search DataStore in
   * @param {String} dataStore DataStore name
   *
   * @returns {Object} An object containing store details or undefined if it cannot be found
   */
  async getDataStore (workspace, dataStore) {
    return this.getStore(workspace, dataStore, 'datastores');
  }

  /**
   * Get specific CoverageStore by name in a workspace.
   *
   * @param {String} workspace The workspace to search CoverageStore in
   * @param {String} covStore CoverageStore name
   *
   * @returns {Object} An object containing store details or undefined if it cannot be found
   */
  async getCoverageStore (workspace, covStore) {
    return this.getStore(workspace, covStore, 'coveragestores');
  }

  /**
   * Get specific WmsStore by name in a workspace.
   *
   * @param {String} workspace The workspace to search WmsStore in
   * @param {String} wmsStore WmsStore name
   *
   * @returns {Object} An object containing store details or undefined if it cannot be found
   *
   */
  async getWmsStore (workspace, wmsStore) {
    return this.getStore(workspace, wmsStore, 'wmsstores');
  }

  /**
   * Get specific WmtsStore by name in a workspace.
   *
   * @param {String} workspace The workspace to search WmtsStore in
   * @param {String} wmtsStore WmtsStore name
   *
   * @returns {Object} An object containing store details or undefined if it cannot be found
   */
  async getWmtsStore (workspace, wmtsStore) {
    return this.getStore(workspace, wmtsStore, 'wmtsstores');
  }

  /**
   * @private
   * Get GeoServer store by type
   *
   * @param {String} workspace The name of the workspace
   * @param {String} storeName The name of the store
   * @param {String} storeType The type of the store
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object containing store details or undefined if it cannot be found
   */
  async getStore (workspace, storeName, storeType) {
    const url = this.url + 'workspaces/' + workspace + '/' + storeType + '/' + storeName + '.json';
    const response = await fetch(url, {
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
   * Creates a GeoTIFF store from a file by path and publishes it as layer.
   * The GeoTIFF file has to be placed on the server, where your GeoServer
   * is running.
   *
   * @param {String} workspace The workspace to create GeoTIFF store in
   * @param {String} coverageStore The name of the new GeoTIFF store
   * @param {String} layerName The published name of the new layer
   * @param {String} layerTitle The published title of the new layer
   * @param {String} filePath The path to the GeoTIFF file on the server
   *
   * @throws Error if request fails
   *
   * @returns {String} The successful response text
   */
  async createGeotiffFromFile (workspace, coverageStore, layerName, layerTitle, filePath) {
    const lyrTitle = layerTitle || layerName;
    const stats = fs.statSync(filePath);
    const fileSizeInBytes = stats.size;
    const readStream = fs.createReadStream(filePath);

    let url = this.url + 'workspaces/' + workspace + '/coveragestores/' +
        coverageStore + '/file.geotiff';
    url += '?filename=' + lyrTitle + '&coverageName=' + layerName;
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'image/tiff',
        'Content-length': fileSizeInBytes
      },
      body: readStream
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    // TODO: enforce JSON response or parse XML
    return response.text();
  }

  /**
   * Creates a PostGIS based data store.
   *
   * @param {String} workspace The WS to create the data store in
   * @param {String} namespaceUri The namespace URI of the workspace
   * @param {String} dataStore The data store name to be created
   * @param {String} pgHost The PostGIS DB host
   * @param {String} pgPort The PostGIS DB port
   * @param {String} pgUser The PostGIS DB user
   * @param {String} pgPassword The PostGIS DB password
   * @param {String} pgSchema The PostGIS DB schema
   * @param {String} pgDb The PostGIS DB name
   * @param {String} [exposePk] expose primary key, defaults to false
   *
   * @throws Error if request fails
   */
  async createPostgisStore (workspace, namespaceUri, dataStore, pgHost, pgPort, pgUser, pgPassword, pgSchema, pgDb, exposePk) {
    const body = {
      dataStore: {
        name: dataStore,
        type: 'PostGIS',
        enabled: true,
        workspace: {
          name: workspace
        },
        connectionParameters: {
          entry: [
            {
              '@key': 'dbtype',
              $: 'postgis'
            },
            {
              '@key': 'schema',
              $: pgSchema
            },
            {
              '@key': 'database',
              $: pgDb
            },
            {
              '@key': 'host',
              $: pgHost
            },
            {
              '@key': 'port',
              $: pgPort
            },
            {
              '@key': 'passwd',
              $: pgPassword
            },
            {
              '@key': 'namespace',
              $: namespaceUri
            },
            {
              '@key': 'user',
              $: pgUser
            },
            {
              '@key': 'Expose primary keys',
              $: exposePk || false
            }
          ]
        }
      }
    };

    const url = this.url + 'workspaces/' + workspace + '/datastores';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    // TODO: not tested yet
    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }

  /**
   * Creates an ImageMosaic store from a zip archive with the 3 necessary files
   *   - datastore.properties
   *   - indexer.properties
   *   - timeregex.properties
   *
   * The zip archive has to be given as absolute path, so before it has to be
   * placed on the server, where your GeoServer is running.
   *
   * @param {String} workspace The WS to create the data store in
   * @param {String} dataStore The data store name
   * @param {String} zipArchivePath Absolute path to zip archive with the 3 properties files
   *
   * @throws Error if request fails
   *
   * @returns {String} The response text
   */
  async createImageMosaicStore (workspace, coverageStore, zipArchivePath) {
    const readStream = fs.createReadStream(zipArchivePath);

    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/file.imagemosaic';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/zip'
      },
      body: readStream
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }

    return response.text();
  };

  /**
   * Creates a WMS based data store.
   *
   * @param {String} workspace The WS to create the data store in
   * @param {String} dataStore The data store name
   * @param {String} wmsCapabilitiesUrl Base WMS capabilities URL
   *
   * @throws Error if request fails
   */
  async createWmsStore (workspace, dataStore, wmsCapabilitiesUrl) {
    const body = {
      wmsStore: {
        name: dataStore,
        type: 'WMS',
        capabilitiesURL: wmsCapabilitiesUrl
      }
    };

    const url = this.url + 'workspaces/' + workspace + '/wmsstores';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }

  /**
   * Creates a WMTS based data store.
   *
   * @param {String} workspace The WS to create the data store in
   * @param {String} dataStore The data store name
   * @param {String} wmtsCapabilitiesUrl Base WMTS capabilities URL
   *
   * @throws Error if request fails
   */
  async createWmtsStore (workspace, dataStore, wmtsCapabilitiesUrl) {
    const body = {
      wmtsStore: {
        name: dataStore,
        type: 'WMTS',
        capabilitiesURL: wmtsCapabilitiesUrl
      }
    };

    const url = this.url + 'workspaces/' + workspace + '/wmtsstores';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }

  /**
   * Creates a WFS based data store.
   *
   * @param {String} workspace The WS to create the data store in
   * @param {String} dataStore The data store name
   * @param {String} wfsCapabilitiesUrl WFS capabilities URL
   * @param {String} namespaceUrl URL of the GeoServer namespace
   * @param {Boolean} [useHttpConnectionPooling=true] use HTTP connection pooling for WFS connection
   *
   * @throws Error if request fails
   */
  async createWfsStore (workspace, dataStore, wfsCapabilitiesUrl, namespaceUrl, useHttpConnectionPooling) {
    const body = {
      dataStore: {
        name: dataStore,
        type: 'Web Feature Server (NG)',
        connectionParameters: {
          entry: [
            {
              '@key': 'WFSDataStoreFactory:GET_CAPABILITIES_URL',
              $: wfsCapabilitiesUrl
            },
            {
              '@key': 'namespace',
              $: namespaceUrl
            },
            {
              '@key': 'WFSDataStoreFactory:USE_HTTP_CONNECTION_POOLING',
              $: useHttpConnectionPooling !== false ? 'true' : 'false'
            }
          ]
        }
      }
    };

    const url = this.url + 'workspaces/' + workspace + '/datastores';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }

  /**
   * Deletes a data store.
   *
   * @param {String} workspace The workspace where the data store is in
   * @param {String} coverageStore Name of data store to delete
   * @param {String} recurse Flag to enable recursive deletion
   *
   * @throws Error if request fails
   */
  async deleteDataStore (workspace, dataStore, recurse) {
    let url = this.url + 'workspaces/' + workspace + '/datastores/' + dataStore;
    url += '?recurse=' + recurse;

    const response = await fetch(url, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: this.auth
      }
    });

    if (!response.ok) {
      // TODO: could not find status codes in the docs or via testing
      //       https://docs.geoserver.org/latest/en/api/#1.0.0/datastores.yaml
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }

  /**
   * Deletes a CoverageStore.
   *
   * @param {String} workspace The workspace where the CoverageStore is in
   * @param {String} coverageStore Name of CoverageStore to delete
   * @param {String} recurse Flag to enable recursive deletion
   *
   * @throws Error if request fails
   */
  async deleteCoverageStore (workspace, coverageStore, recurse) {
    let url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore;
    url += '?recurse=' + recurse;

    const response = await fetch(url, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: this.auth
      }
    });

    // TODO: could not test it
    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      switch (response.status) {
        case 401:
          throw new GeoServerResponseError('Deletion failed. There might be dependant objects to ' +
          'this store. Delete them first or call this with "recurse=false"', geoServerResponse);
        default:
          throw new GeoServerResponseError(null, geoServerResponse);
      }
    }
  }

  /**
   * Creates a GeoPackage store from a file placed in the geoserver_data dir.
   *
   * @param {String} workspace The WS to create the data store in
   * @param {String} dataStore The data store name
   * @param {String} gpkgPath Relative path to GeoPackage file within geoserver_data dir
   *
   * @throws Error if request fails
   */
  async createGpkgStore (workspace, dataStore, gpkgPath) {
    const body = {
      dataStore: {
        name: dataStore,
        type: 'GeoPackage',
        connectionParameters: {
          entry: [
            {
              '@key': 'database',
              $: `file:${gpkgPath}`
            },
            {
              '@key': 'dbtype',
              $: 'geopkg'
            }
          ]
        }
      }
    };

    const url = this.url + 'workspaces/' + workspace + '/datastores';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }
}
