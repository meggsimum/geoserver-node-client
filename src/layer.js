import fetch from 'node-fetch';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';

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
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with layer information
   */
  async get (qualifiedName) {
    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'layers/' + qualifiedName + '.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return await response.json();
  }

  /**
   * Sets the attribution text and link of a layer.
   *
   * @param {String} qualifiedName GeoServer layer name with workspace prefix
   * @param {String} [attributionText] The attribution text
   * @param {String} [attributionLink] The attribution link
   *
   * @throws Error if request fails
   *
   * @returns {Boolean} If attribution could be updated
   */
  async modifyAttribution (qualifiedName, attributionText, attributionLink) {
    // take existing layer properties as template
    const jsonBody = await this.get(qualifiedName);

    // set attribution text and link
    if (attributionText) {
      jsonBody.layer.attribution.title = attributionText;
    }
    if (attributionLink) {
      jsonBody.layer.attribution.href = attributionLink;
    }

    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'layers/' + qualifiedName + '.json';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonBody)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return true;
  }

  /**
   * Returns all layers in the GeoServer.
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with all layer information
   */
  async getAll () {
    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'layers.json', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
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
   *
   * @returns {Boolean} If FeatureType could be published.
   */
  async publishFeatureTypeDefaultDataStore (workspace, nativeName, name, title, srs, enabled, abstract) {
    const body = {
      featureType: {
        name: name,
        nativeName: name,
        title: title || name,
        srs: srs || 'EPSG:4326',
        enabled: enabled,
        abstract: abstract || ''
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

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return true;
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
   *
   * @returns {Boolean} If the FeatureType could be published
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

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return true;
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
   *
   * @returns {Boolean} If the wms layer could be published
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

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return true;
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
   *
   * @returns {Boolean} If raster could be published
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

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return true;
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
   *
   * @returns {Boolean} If the feature type could be deleted
   */
  async deleteFeatureType (workspace, datastore, name, recurse) {
    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const response = await fetch(this.url + 'workspaces/' + workspace + '/datastores/' + datastore + '/featuretypes/' + name + '?recurse=' + recurse, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      throw new GeoServerResponseError('Requesting GeoServer failed:' + await response.text());
    }
    return true;
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
   *
   * @returns {Boolean} If time dimension could be enabled
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
                presentation: 'DISCRETE_INTERVAL',
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

    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + dataStore + '/coverages/' + name + '.json';
    console.log(url);
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return true;
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
   * @param {String} [acceptableInterval] Tolerance interval for nearest mach (e.g. 'PT30M'), only has an effect if 'nearestMatchEnabled' is true
   *
   * @throws Error if request fails
   *
   * @returns {Boolean} If TIME dimension could be enabled
   */
  async enableTimeFeatureType (workspace, dataStore, name, attribute, presentation, resolution, defaultValue, nearestMatchEnabled, rawNearestMatchEnabled, acceptableInterval) {
    const body = {
      featureType: {
        metadata: {
          entry: [
            {
              '@key': 'time',
              dimensionInfo: {
                enabled: true,
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

    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'workspaces/' + workspace + '/datastores/' + dataStore + '/featuretypes/' + name + '.json';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'PUT',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return true;
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
   * @returns {Object} An object with coverage information
   */
  async getCoverage (workspace, coverageStore, name) {
    const auth = Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/coverages/' + name + '.json';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
    return true;
  }
}
