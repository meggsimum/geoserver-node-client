import fetch from 'node-fetch';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';
import AboutClient from './about.js'

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
   * @param {String} auth The Basic Authentication string
   */
  constructor (url, auth) {
    this.url = url;
    this.auth = auth;
  }

  /**
   * Returns a GeoServer layer by the given workspace and layer name,
   * e.g. "myWs:myLayer".
   *
   * @param {String} workspace The name of the workspace, can be undefined
   * @param {String} layerName The name of the layer to query
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with layer information or undefined if it cannot be found
   */
  async get (workspace, layerName) {
    let qualifiedName;
    if (workspace) {
      qualifiedName = `${workspace}:${layerName}`;
    } else {
      qualifiedName = layerName;
    }
    const response = await fetch(this.url + 'layers/' + qualifiedName + '.json', {
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
   * Sets the attribution text and link of a layer.
   *
   * @param {String} workspace The name of the workspace, can be undefined
   * @param {String} layerName The name of the layer to query
   * @param {String} [attributionText] The attribution text
   * @param {String} [attributionLink] The attribution link
   *
   * @throws Error if request fails
   */
  async modifyAttribution (workspace, layerName, attributionText, attributionLink) {
    let qualifiedName;
    if (workspace) {
      qualifiedName = `${workspace}:${layerName}`;
    } else {
      qualifiedName = layerName;
    }
    // take existing layer properties as template
    const jsonBody = await this.get(workspace, layerName);

    if (!jsonBody || !jsonBody.layer || !jsonBody.layer.attribution) {
      throw new GeoServerResponseError(
        `layer '${workspace}:${layerName}' misses the property 'attribution'`
      );
    }

    // set attribution text and link
    if (attributionText) {
      jsonBody.layer.attribution.title = attributionText;
    }
    if (attributionLink) {
      jsonBody.layer.attribution.href = attributionLink;
    }

    const url = this.url + 'layers/' + qualifiedName + '.json';
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

  /**
   * Returns all layers in the GeoServer.
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with all layer information
   */
  async getAll () {
    const response = await fetch(this.url + 'layers.json', {
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
   * Get all layers of a workspace.
   *
   * @param {String} workspace The workspace
   *
   * @throws Error if request fails
   *
   * @return {Object} An object with the information about the layers
   */
  async getLayers (workspace) {
    const response = await fetch(this.url + 'workspaces/' + workspace + '/layers.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: this.auth,
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }

    return await response.json();
  }

  /**
   * Returns information about a cascaded WMS layer.
   *
   * @param {String} workspace The workspace
   * @param {String} datastore The datastore
   * @param {String} layerName The WMS layer name
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with layer information or undefined if it cannot be found
   */
  async getWmsLayer (workspace, datastore, layerName) {
    const response = await fetch(this.url + 'workspaces/' + workspace + '/wmsstores/' + datastore + '/wmslayers/' + layerName + '.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: this.auth,
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

    return await response.json();
  }

  // TODO: automated test needed
  /**
   * Returns information about a cascaded WMTS layer.
   *
   * @param {String} workspace The workspace
   * @param {String} datastore The datastore
   * @param {String} layerName The WMTS layer name
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with layer information or undefined if it cannot be found
   */
   async getWmtsLayer (workspace, datastore, layerName) {
    const response = await fetch(this.url + 'workspaces/' + workspace + '/wmtsstores/' + datastore + '/layers/' + layerName + '.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: this.auth,
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

    return await response.json();
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
   * @param {String} [abstract] The abstract of the layer
   *
   * @throws Error if request fails
   */
  async publishFeatureTypeDefaultDataStore (workspace, nativeName, name, title, srs, enabled, abstract) {
    const body = {
      featureType: {
        name: name,
        nativeName: nativeName || name,
        title: title || name,
        srs: srs || 'EPSG:4326',
        enabled: enabled,
        abstract: abstract || ''
      }
    };

    const response = await fetch(this.url + 'workspaces/' + workspace + '/featuretypes', {
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
   * Publishes a FeatureType in the given data store of the workspace.
   *
   * @param {String} workspace Workspace to publish FeatureType in
   * @param {String} dataStore The datastore where the FeatureType's data is in
   * @param {String} [nativeName] Native name of FeatureType
   * @param {String} name Published name of FeatureType
   * @param {String} [title] Published title of FeatureType
   * @param {String} [srs="EPSG:4326"] The SRS of the FeatureType
   * @param {String} enabled Flag to enable FeatureType by default
   * @param {String} [abstract] The abstract of the layer
   * @param {String} [nativeBoundingBox] The native BoundingBox of the FeatureType (has to be set if no data is in store at creation time)
   *
   * @throws Error if request fails
   */
  async publishFeatureType (workspace, dataStore, nativeName, name, title, srs, enabled, abstract, nativeBoundingBox) {
    // apply CRS info for native BBOX if not provided
    if (nativeBoundingBox && !nativeBoundingBox.crs) {
      nativeBoundingBox.crs = {
        '@class': 'projected',
        $: srs
      }
    }

    const body = {
      featureType: {
        name: name || nativeName,
        nativeName: nativeName,
        title: title || name,
        srs: srs || 'EPSG:4326',
        enabled: enabled,
        abstract: abstract || '',
        nativeBoundingBox: nativeBoundingBox
      }
    };

    const response = await fetch(this.url + 'workspaces/' + workspace + '/datastores/' + dataStore + '/featuretypes', {
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
   * Get detailed information about a FeatureType.
   *
   * @param {String} workspace The workspace of the FeatureType
   * @param {String} datastore The datastore of the FeatureType
   * @param {String} name The name of the FeatureType
   *
   * @throws Error if request fails
   *
   * @returns {Object} The object of the FeatureType
   */
  async getFeatureType (workspace, datastore, name) {
    const url = this.url + 'workspaces/' + workspace + '/datastores/' + datastore + '/featuretypes/' + name + '.json';
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
        // GeoServer exists, but requested item does not exist, we return empty
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
   *  Publishes a WMS layer.
   *
   * @param {String} workspace Workspace to publish WMS layer in
   * @param {String} dataStore The datastore where the WMS is connected
   * @param {String} nativeName Native name of WMS layer
   * @param {String} [name] Published name of WMS layer
   * @param {String} [title] Published title of WMS layer
   * @param {String} [srs="EPSG:4326"] The SRS of the WMS layer
   * @param {String} enabled Flag to enable WMS layer by default
   * @param {String} [abstract] The abstract of the layer
   *
   * @throws Error if request fails
   */
  async publishWmsLayer (workspace, dataStore, nativeName, name, title, srs, enabled, abstract) {
    const body = {
      wmsLayer: {
        name: name || nativeName,
        nativeName: nativeName,
        title: title || name || nativeName,
        srs: srs || 'EPSG:4326',
        enabled: enabled,
        abstract: abstract || ''
      }
    };

    const response = await fetch(this.url + 'workspaces/' + workspace + '/wmsstores/' + dataStore + '/wmslayers', {
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
   * Publishes a raster stored in a database.
   *
   * @param {String} workspace Workspace to publish layer in
   * @param {String} coverageStore The coveragestore where the layer's data is in
   * @param {String} nativeName Native name of raster
   * @param {String} name Published name of layer
   * @param {String} [title] Published title of layer
   * @param {String} [srs="EPSG:4326"] The SRS of the layer
   * @param {String} enabled Flag to enable layer by default
   * @param {String} [abstract] The abstract of the layer
   *
   * @throws Error if request fails
   */
  async publishDbRaster (workspace, coverageStore, nativeName, name, title, srs, enabled, abstract) {
    const body = {
      coverage: {
        name: name || nativeName,
        nativeName: nativeName,
        title: title || name,
        srs: srs,
        enabled: enabled,
        abstract: abstract || ''
      }
    };

    const response = await fetch(this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/coverages', {
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
   * Deletes a FeatureType.
   *
   * @param {String} workspace Workspace where layer to delete is in
   * @param {String} datastore The datastore where the layer to delete is in
   * @param {String} name Layer to delete
   * @param {Boolean} recurse Flag to enable recursive deletion
   *
   * @throws Error if request fails
   */
  async deleteFeatureType (workspace, datastore, name, recurse) {
    const response = await fetch(this.url + 'workspaces/' + workspace + '/datastores/' + datastore + '/featuretypes/' + name + '?recurse=' + recurse, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: this.auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }

  /**
   * Enables TIME dimension for the given coverage layer.
   *
   * @param {String} workspace Workspace where layer to enable time dimension for is in
   * @param {String} datastore The datastore where the layer to enable time dimension for is in
   * @param {String} name Layer to enable time dimension for
   * @param {String} presentation Presentation type: 'LIST' or 'DISCRETE_INTERVAL' or 'CONTINUOUS_INTERVAL'
   * @param {Number} resolution Resolution in milliseconds, e.g. 3600000 for 1 hour
   * @param {String} defaultValue The default time value, e.g. 'MINIMUM' or 'MAXIMUM' or 'NEAREST' or 'FIXED'
   * @param {Boolean} [nearestMatchEnabled] Enable nearest match
   * @param {Boolean} [rawNearestMatchEnabled] Enable raw nearest match
   * @param {String} [acceptableInterval] Acceptable interval for nearest match, e.g.'PT30M'
   *
   * @throws Error if request fails
   */
  async enableTimeCoverage (workspace, dataStore, name, presentation, resolution, defaultValue, nearestMatchEnabled, rawNearestMatchEnabled, acceptableInterval) {
    const body = {
      coverage: {
        metadata: {
          entry: [
            {
              '@key': 'time',
              dimensionInfo: {
                enabled: true,
                presentation: presentation || 'DISCRETE_INTERVAL',
                resolution: resolution,
                units: 'ISO8601',
                defaultValue: {
                  strategy: defaultValue
                },
                nearestMatchEnabled: nearestMatchEnabled,
                rawNearestMatchEnabled: rawNearestMatchEnabled,
                acceptableInterval: acceptableInterval
              }
            }
          ]
        }
      }
    };

    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + dataStore + '/coverages/' + name + '.json';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
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
   * Enables TIME dimension for the given FeatureType layer.
   *
   * @param {String} workspace Workspace containing layer to enable time dimension for
   * @param {String} datastore The datastore containing the FeatureType to enable time dimension for
   * @param {String} name FeatureType to enable time dimension for
   * @param {String} attribute Data column / attribute holding the time values
   * @param {String} presentation Presentation type: 'LIST' or 'DISCRETE_INTERVAL' or 'CONTINUOUS_INTERVAL'
   * @param {Number} resolution Resolution in milliseconds, e.g. 3600000 for 1 hour
   * @param {String} defaultValue The default time value, e.g. 'MINIMUM' or 'MAXIMUM' or 'NEAREST' or 'FIXED'
   * @param {Boolean} [nearestMatchEnabled] Enable nearest match
   * @param {Boolean} [rawNearestMatchEnabled] Enable raw nearest match
   *
   * @throws Error if request fails
   */
  async enableTimeFeatureType (workspace, dataStore, name, attribute, presentation, resolution, defaultValue, nearestMatchEnabled, rawNearestMatchEnabled, acceptableInterval) {
    const body = {
      featureType: {
        metadata: {
          entry: [
            {
              '@key': 'time',
              dimensionInfo: {
                attribute: attribute,
                presentation: presentation,
                resolution: resolution,
                units: 'ISO8601',
                defaultValue: {
                  strategy: defaultValue
                },
                nearestMatchEnabled: nearestMatchEnabled,
                rawNearestMatchEnabled: rawNearestMatchEnabled,
                acceptableInterval: acceptableInterval
              }
            }
          ]
        }
      }
    };

    const url = this.url + 'workspaces/' + workspace + '/datastores/' + dataStore + '/featuretypes/' + name + '.json';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
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
   * Returns a dedicated coverage object.
   *
   * @param {String} workspace Workspace containing the coverage
   * @param {String} coverageStore The coveragestore containing the coverage
   * @param {String} name Coverage to query
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with coverage information or undefined if it cannot be found
   */
  async getCoverage (workspace, coverageStore, name) {
    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/coverages/' + name + '.json';
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
   * Renames the existing bands of a coverage layer.
   *
   * Make sure to provide the same number of bands as existing in the layer.
   *
   * @param {String} workspace Workspace of layer
   * @param {String} datastore The datastore of the layer
   * @param {String} layername The layer name
   * @param {String[]} bandNames An array of the new band names in correct order
   *
   * @throws Error if request fails
   */
  async renameCoverageBands (workspace, dataStore, layername, bandNames) {
    const body = {
      coverage: {
        dimensions: {
          coverageDimension: [
          ]
        }
      }
    };

    // dynamically create the body
    bandNames.forEach(bandName => {
      body.coverage.dimensions.coverageDimension.push(
        {
          name: bandName
        }
      );
    })

    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + dataStore + '/coverages/' + layername + '.json';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
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
