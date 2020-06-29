import fetch from 'node-fetch';

/**
 * Client for GeoServer layers
 *
 * @module LayerClient
 */
export default class LayerClient {
  /**
   * Creates a GeoServer REST LayerClient instance.
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
   * Returns a GeoServer layer by the given full qualified layer name,
   * e.g. "myWs:myLayer".
   *
   * @param {String} qualifiedName GeoServer layer name with workspace prefix
   */
  async get (qualifiedName) {
    try {
      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'layers/' + qualifiedName + '.json', {
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
   * Returns all layers in the GeoServer.
   */
  async getAll () {
    try {
      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'layers.json', {
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
   * Publishes a FeatureType in the default data store of the workspace.
   *
   * @param {String} workspace Workspace to publish FeatureType in
   * @param {String} [nativeName] Native name of FeatureType
   * @param {String} name Published name of FeatureType
   * @param {String} [title] Published title of FeatureType
   * @param {String} [srs="EPSG:4326"] The SRS of the FeatureType
   * @param {String} enabled Flag to enable FeatureType by default
   */
  async publishFeatureTypeDefaultDataStore (workspace, nativeName, name, title, srs, enabled) {
    try {
      const body = {
        featureType: {
          name: name,
          nativeName: name,
          title: title || name,
          srs: srs || 'EPSG:4326',
          enabled: enabled
        }
      };

      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces/' + workspace + '/featuretypes', {
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
    } catch (error) {
      return false;
    }
  }

  /**
   * Publishes a FeatureType in the given data store of the workspace.
   *
   * @param {String} workspace Workspace to publish FeatureType in
   * @param {String} dataStore The datastore where the FeatureType's data is in
   * @param {String} [nativeName] Native name of FeatureType
   * @param {String} name Published name of FeatureType
   * @param {String} [title] Published title of FeatureType
   * @param {String} [srs="EPSG:4326"] The SRS of the FeatureType
   * @param {String} enabled Flag to enable FeatureType by default
   */
  async publishFeatureType (workspace, dataStore, nativeName, name, title, srs, enabled) {
    try {
      const body = {
        featureType: {
          name: name || nativeName,
          nativeName: nativeName,
          title: title || name,
          srs: srs || 'EPSG:4326',
          enabled: enabled
        }
      };

      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces/' + workspace + '/datastores/' + dataStore + '/featuretypes', {
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
    } catch (error) {
      return false;
    }
  }

  /**
   *
   * @param {String} workspace Workspace to publish WMS layer in
   * @param {String} dataStore The datastore where the WMS is connected
   * @param {String} nativeName Native name of WMS layer
   * @param {String} [name] Published name of WMS layer
   * @param {String} [title] Published title of WMS layer
   * @param {String} [srs="EPSG:4326"] The SRS of the WMS layer
   * @param {String} enabled Flag to enable WMS layer by default
   */
  async publishWmsLayer (workspace, dataStore, nativeName, name, title, srs, enabled) {
    try {
      const body = {
        wmsLayer: {
          name: name || nativeName,
          nativeName: nativeName,
          title: title || name || nativeName,
          srs: srs || 'EPSG:4326',
          enabled: enabled
        }
      };

      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces/' + workspace + '/wmsstores/' + dataStore + '/wmslayers', {
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
    } catch (error) {
      return false;
    }
  }

  /**
   * Publishes a raster stored in a database.
   *
   * @param {String} workspace Workspace to publish layer in
   * @param {String} coverageStore The coveragestore where the layer's data is in
   * @param {String} nativeName Native name of raster
   * @param {String} name Published name of layer
   * @param {String} [title] Published title of layer
   * @param {String} [srs="EPSG:4326"] The SRS of the layer
   * @param {String} enabled Flag to enable layer by default
   */
  async publishDbRaster (workspace, coverageStore, nativeName, name, title, srs, enabled) {
    try {
      const body = {
        coverage: {
          name: name || nativeName,
          nativeName: nativeName,
          title: title || name,
          srs: srs,
          enabled: enabled
        }
      };

      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/coverages', {
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
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Deletes a FeatureType.
   *
   * @param {String} workspace Workspace where layer to delete is in
   * @param {String} datastore The datastore where the layer to delete is in
   * @param {String} name Layer to delete
   * @param {Boolean} recurse Flag to enable recursive deletion
   */
  async deleteFeatureType (workspace, datastore, name, recurse) {
    try {
      const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
      const response = await fetch(this.url + 'workspaces/' + workspace + '/datastores/' + datastore + '/featuretypes/' + name + '?recurse=' + recurse, {
        credentials: 'include',
        method: 'DELETE',
        headers: {
          Authorization: 'Basic ' + auth
        }
      });

      if (response.status === 200) {
        return true;
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }
}
