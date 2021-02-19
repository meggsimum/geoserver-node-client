import fetch from 'node-fetch';
import fs from 'fs';

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
   * @param {String} user The user for the GeoServer REST API
   * @param {String} password The password for the GeoServer REST API
   */
  constructor (url, user, password) {
    this.url = url.endsWith('/') ? url : url + '/';
    this.user = user;
    this.password = password;
  }

  /**
   * Get all DataStores in a workspace.
   *
   * @param {String} workspace The workspace to get DataStores for
   */
  async getDataStores (workspace) {
    return this.getStores(workspace, 'datastores');
  }

  /**
   * Get all CoverageStores in a workspace.
   *
   * @param {String} workspace The workspace to get CoverageStores for
   */
  async getCoverageStores (workspace) {
    return this.getStores(workspace, 'coveragestores');
  }

  /**
   * Get all WmsStores in a workspace.
   *
   * @param {String} workspace The workspace to get WmsStores for
   */
  async getWmsStores (workspace) {
    return this.getStores(workspace, 'wmsstores');
  }

  /**
   * Get all WmtsStores in a workspace.
   *
   * @param {String} workspace The workspace to get WmtsStores for
   */
  async getWmtsStores (workspace) {
    return this.getStores(workspace, 'wmtsstores');
  }

  /**
   * @private
   * @param {String} workspace
   * @param {String} storeType
   */
  async getStores (workspace, storeType) {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces/' + workspace + '/' + storeType + '.json', {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });
      if (response.status === 200) {
        return await response.json();
      }
      console.warn(await response.text());
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get specific DataStore by name in a workspace.
   *
   * @param {String} workspace The workspace to search DataStore in
   * @param {String} dataStore DataStore name
   */
  async getDataStore (workspace, dataStore) {
    return this.getStore(workspace, dataStore, 'datastores');
  }

  /**
   * Get specific CoverageStore by name in a workspace.
   *
   * @param {String} workspace The workspace to search CoverageStore in
   * @param {String} covStore CoverageStore name
   */
  async getCoverageStore (workspace, covStore) {
    return this.getStore(workspace, covStore, 'coveragestores');
  }

  /**
   * Get specific WmsStore by name in a workspace.
   *
   * @param {String} workspace The workspace to search WmsStore in
   * @param {String} wmsStore WmsStore name
   */
  async getWmsStore (workspace, wmsStore) {
    return this.getStore(workspace, wmsStore, 'wmsstores');
  }

  /**
   * Get specific WmtsStore by name in a workspace.
   *
   * @param {String} workspace The workspace to search WmtsStore in
   * @param {String} wmtsStore WmtsStore name
   */
  async getWmtsStore (workspace, wmtsStore) {
    return this.getStore(workspace, wmtsStore, 'wmtsstores');
  }

  /**
   * @private
   * @param {String} workspace
   * @param {String} storeName
   * @param {String} storeType
   */
  async getStore (workspace, storeName, storeType) {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      const url = this.url + 'workspaces/' + workspace + '/' + storeType + '/' + storeName + '.json';
      const response = await fetch(url, {
        credentials: 'include',
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });
      if (response.status === 200) {
        return await response.json();
      } else if (response.status === 404) {
        console.warn('No ' + storeType + ' with name "' + storeName + '" found');
        return false;
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
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
   */
  async createGeotiffFromFile (workspace, coverageStore, layerName, layerTitle, filePath) {
    try {
      const lyrTitle = layerTitle || layerName;
      const stats = fs.statSync(filePath);
      const fileSizeInBytes = stats.size;
      const readStream = fs.createReadStream(filePath);

      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      let url = this.url + 'workspaces/' + workspace + '/coveragestores/' +
        coverageStore + '/file.geotiff';
      url += '?filename=' + layerTitle + '&coverageName=' + lyrTitle;
      const response = await fetch(url, {
        credentials: 'include',
        method: 'PUT',
        headers: {
          Authorization: 'Basic ' + auth,
          'Content-Type': 'image/tiff',
          'Content-length': fileSizeInBytes
        },
        body: readStream
      });

      if (response.status === 201) {
        const responseText = await response.text();
        // TODO enforce JSON response or parse XML
        return responseText;
      } else {
        return false;
      }
    } catch (error) {
      return false;
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
   * @param {String} zipArchivePath Aboslute path to zip archive with the 3 properties files
   */
  async createImageMosaicStore (workspace, coverageStore, zipArchivePath) {
    try {
      const readStream = fs.createReadStream(zipArchivePath);
      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/file.imagemosaic';
      const response = await fetch(url, {
        credentials: 'include',
        method: 'PUT',
        headers: {
          Authorization: 'Basic ' + auth,
          'Content-Type': 'application/zip'
        },
        body: readStream
      });

      if (response.status === 201) {
        return await response.text();
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  /**
   * Creates a WMS based data store.
   *
   * @param {String} workspace The WS to create the data store in
   * @param {String} dataStore The data store name
   * @param {String} wmsCapabilitiesUrl Base WMS capabilities URL
   */
  async createWmsStore (workspace, dataStore, wmsCapabilitiesUrl) {
    const body = {
      wmsStore: {
        name: dataStore,
        type: 'WMS',
        capabilitiesURL: wmsCapabilitiesUrl
      }
    };

    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'workspaces/' + workspace + '/wmsstores';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.status === 201) {
      return true;
    } else {
      console.warn(await response.text());
      return false;
    }
  }

  /**
   * Creates a WFS based data store.
   *
   * @param {String} workspace The WS to create the data store in
   * @param {String} dataStore The data store name
   * @param {String} wfsCapabilitiesUrl WFS capabilities URL
   * @param {String} namespaceUrl URL of the GeoServer namespace
   */
  async createWfsStore (workspace, dataStore, wfsCapabilitiesUrl, namespaceUrl) {
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
            }
          ]
        }
      }
    };

    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'workspaces/' + workspace + '/datastores';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.status === 201) {
      return true;
    } else {
      console.warn(await response.text());
      return false;
    }
  }

  /**
   * Deletes a data store.
   *
   * @param {String} workspace The workspace where the data store is in
   * @param {String} coverageStore Name of data store to delete
   * @param {String} recurse Flag to enable recursive deletion
   */
  async deleteDataStore (workspace, dataStore, recurse) {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      let url = this.url + 'workspaces/' + workspace + '/datastores/' + dataStore;
      url += '?recurse=' + recurse;

      const response = await fetch(url, {
        credentials: 'include',
        method: 'DELETE',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });

      if (response.status === 200) {
        return true;
      } else if (response.status === 401) {
        console.warn('Deletion failed. There might be dependant objects to ' +
          'this store. Delete them first or call this with "recurse=false"');
        console.warn(response.text());
        return false;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Deletes a CoverageStore.
   *
   * @param {String} workspace The workspace where the CoverageStore is in
   * @param {String} coverageStore Name of CoverageStore to delete
   * @param {String} recurse Flag to enable recursive deletion
   */
  async deleteCoverageStore (workspace, coverageStore, recurse) {
    try {
      const auth =
        Buffer.from(this.user + ':' + this.password).toString('base64');
      let url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore;
      url += '?recurse=' + recurse;

      const response = await fetch(url, {
        credentials: 'include',
        method: 'DELETE',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });

      if (response.status === 200) {
        return true;
      } else if (response.status === 401) {
        console.warn('Deletion failed. There might be dependant objects to ' +
          'this store. Delete them first or call this with "recurse=false"');
        console.warn(response.text());
        return false;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Creates a GeoPackage store from a file placed in the geoserver_data dir.
   *
   * @param {String} workspace The WS to create the data store in
   * @param {String} dataStore The data store name
   * @param {String} gpkgPath Relative path to GeoPackage file within geoserver_data dir
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

    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'workspaces/' + workspace + '/datastores';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (response.status === 201) {
      return true;
    } else {
      console.warn(await response.text());
      return false;
    }
  }
}
