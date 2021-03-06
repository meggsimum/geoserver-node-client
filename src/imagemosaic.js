import fetch from 'node-fetch';

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
   * @returns {Object|Boolean} An object with the granules or 'false'
   */
  async getGranules (workspace, coverageStore, coverage) {
    try {
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
   * Harvests all granules in the given folder for an image mosaic.
   *
   * @param {String} workspace Workspace of image mosaic
   * @param {String} coverageStore CoverageStore of image mosaic
   * @param {String} filePath Server path of folder to harvest
   *
   * @returns {Object|Boolean} An object with the granules or 'false'
   */
  async harvestGranules (workspace, coverageStore, filePath) {
    try {
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

      if (response.status === 200) {
        return await response.text();
      } else {
        console.warn(await response.text());
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Adds a granule (defined by a server file) to an image mosaic.
   *
   * @param {String} workspace Workspace of image mosaic
   * @param {String} coverageStore CoverageStore of image mosaic
   * @param {String} filePath Server file path of new granule
   *
   * @returns {Boolean} If granule could be added
   */
  async addGranuleByServerFile (workspace, coverageStore, filePath) {
    try {
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

      if (response.status === 202) {
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
   * Deletes a single granule of an image mosaic.
   *
   * @param {*} workspace Workspace of image mosaic
   * @param {*} coverageStore CoverageStore of image mosaic
   * @param {*} coverage Name of image mosaic
   * @param {*} covFileLocation Location of coverage file
   *
   * @returns {Boolean} If granule could be deleted
   */
  async deleteSingleGranule (workspace, coverageStore, coverage, covFileLocation) {
    try {
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
