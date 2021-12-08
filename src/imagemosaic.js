import fetch from 'node-fetch';
import { GeoServerResponseError } from './errors.js';

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
   * @param {String} user The user for the GeoServer REST API
   * @param {String} password The password for the GeoServer REST API
   */
  constructor (url, user, password) {
    this.url = url.endsWith('/') ? url : url + '/';
    this.user = user;
    this.password = password;
  }

  /**
   * Returns all granules of an image mosaic.
   *
   * @param {String} workspace Workspace of image mosaic
   * @param {String} coverageStore CoverageStore of image mosaic
   * @param {*} coverage Name of image mosaic
   *
   * @throws Error if request fails
   *
   * @returns {Object} An object with the granules
   */
  async getGranules (workspace, coverageStore, coverage) {
    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' +
        coverageStore + '/coverages/' + coverage + '/index/granules.json';
    const response = await fetch(url, {
      credentials: 'include',
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-type': 'text/plain'
      }
    });

    if (!response.ok) {
      throw new GeoServerResponseError('Requesting GeoServer failed:' + await response.text());
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
    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/external.imagemosaic';

    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-Type': 'text/plain'
      },
      body: filePath
    });

    if (!response.ok) {
      throw new GeoServerResponseError('Requesting GeoServer failed:' + await response.text());
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
   *
   * @returns {Boolean} If granule could be added
   */
  async addGranuleByServerFile (workspace, coverageStore, filePath) {
    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    const url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/external.imagemosaic';

    const response = await fetch(url, {
      credentials: 'include',
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-type': 'text/plain'
      },
      body: filePath
    });

    if (!response.ok) {
      throw new GeoServerResponseError('Requesting GeoServer failed:' + await response.text());
    }

    return true;
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
   *
   * @returns {Boolean} If granule could be deleted
   */
  async deleteSingleGranule (workspace, coverageStore, coverage, covFileLocation) {
    const auth =
      Buffer.from(this.user + ':' + this.password).toString('base64');
    let url = this.url + 'workspaces/' + workspace + '/coveragestores/' + coverageStore + '/coverages/' + coverage + '/index/granules.xml';
    url += '?filter=location=\'' + covFileLocation + '\'';

    const response = await fetch(url, {
      credentials: 'include',
      method: 'DELETE',
      headers: {
        Authorization: 'Basic ' + auth,
        'Content-type': 'text/plain'
      }
    });

    if (!response.ok) {
      throw new GeoServerResponseError('Requesting GeoServer failed:' + await response.text());
    }

    return true;
  }
}
