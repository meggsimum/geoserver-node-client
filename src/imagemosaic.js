import fetch from 'node-fetch';
import { getGeoServerResponseText, GeoServerResponseError } from './util/geoserver.js';

/**
 * Client for GeoServer image mosaics
 *
 * @module ImageMosaicClient
 */
export default class ImageMosaicClient {
  /**
   * Creates a GeoServer REST ImageMosaicClient instance.
   *
   * @param {String} url The URL of the GeoServer REST API endpoint
   * @param {String} auth The Basic Authentication string
   */
  constructor (url, auth) {
    this.url = url;
    this.auth = auth;
  }

  /**
   * Returns all granules of an image mosaic.
   *
   * @param {String} workspace Workspace of image mosaic
   * @param {String} coverageStore CoverageStore of image mosaic
   * @param {String} coverage Name of image mosaic
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with the granules
   */
  async getGranules (workspace, coverageStore, coverage) {
    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' +
        coverageStore + '/coverages/' + coverage + '/index/granules.json';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: this.auth,
        'Content-type': 'text/plain'
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }

    return response.json();
  }

  /**
   * Harvests all granules in the given folder for an image mosaic.
   *
   * @param {String} workspace Workspace of image mosaic
   * @param {String} coverageStore CoverageStore of image mosaic
   * @param {String} filePath Server path of folder to harvest
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with the granules
   */
  async harvestGranules (workspace, coverageStore, filePath) {
    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/external.imagemosaic';

    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-Type': 'text/plain'
      },
      body: filePath
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }

    return response.json();
  }

  /**
   * Adds a granule (defined by a server file) to an image mosaic.
   *
   * @param {String} workspace Workspace of image mosaic
   * @param {String} coverageStore CoverageStore of image mosaic
   * @param {String} filePath Server file path of new granule
   *
   * @throws Error if request fails
   */
  async addGranuleByServerFile (workspace, coverageStore, filePath) {
    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/external.imagemosaic';

    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: this.auth,
        'Content-type': 'text/plain'
      },
      body: filePath
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }
  }

  /**
   * Deletes a single granule of an image mosaic.
   *
   * @param {String} workspace Workspace of image mosaic
   * @param {String} coverageStore CoverageStore of image mosaic
   * @param {String} coverage Name of image mosaic
   * @param {String} covFileLocation Location of coverage file
   *
   * @throws Error if request fails
   */
  async deleteSingleGranule (workspace, coverageStore, coverage, covFileLocation) {
    let url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/coverages/' + coverage + '/index/granules.xml';
    url += '?filter=location=\'' + covFileLocation + '\'';

    const response = await fetch(url, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: this.auth,
        'Content-type': 'text/plain'
      }
    });

    if (!response.ok) {
      const geoServerResponse = await getGeoServerResponseText(response);
      throw new GeoServerResponseError(null, geoServerResponse);
    }

    return true;
  }
}
