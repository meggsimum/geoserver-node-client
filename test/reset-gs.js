import { GeoServerRestClient } from '../geoserver-rest-client.js';

/**
 * Helper script to empty a default GeoServer instance
 */

const port = process.env.GEOSERVER_PORT || 8080;
const url = `http://localhost:${port}/geoserver/rest/`;
const user = 'admin';
const pw = 'geoserver';
const grc = new GeoServerRestClient(url, user, pw);

main();

/**
 * Async main function triggering all required requests
 */
async function main() {
  // delete all workspaces
  const recurse = true;
  const allWs = await grc.workspaces.getAll();
  const wsArray = allWs.workspaces.workspace;
  for (let index = 0; index < wsArray.length; index++) {
    const wsObj = wsArray[index];
    let wsName = wsObj.name;
    // hack: add .json to get other '.' in name ignored by GS
    if (wsName.includes('.') === true) {
      wsName += '.json';
    }

    try {
      console.info('Deleting workspace', wsName, '...');
      await grc.workspaces.delete(wsName, recurse);
      console.info('... done');
    } catch (error) {
      console.error(error);
    }
  }

  // delete all styles
  const defaultStyles = await grc.styles.getDefaults();
  // following styles are not allowed to delete by GS
  const nonDeletable = ['generic', 'line', 'point', 'polygon', 'raster'];
  const purge = true;
  const defaultStylesArray = defaultStyles.styles.style;
  if (defaultStylesArray) {
    for (let index = 0; index < defaultStylesArray.length; index++) {
      const styleObj = defaultStylesArray[index];
      const styleName = styleObj.name;
      try {
        if (!nonDeletable.includes(styleName)) {
          console.info('Deleting style', styleName, '...');
          await grc.styles.delete(undefined, styleName, recurse, purge);
          console.info('... done');
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}
