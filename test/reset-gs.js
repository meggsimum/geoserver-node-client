import { GeoServerRestClient } from '../geoserver-rest-client.js';

const port = process.env.GEOSERVER_PORT || 8080;
const url = `http://localhost:${port}/geoserver/rest/`;
const user = 'admin';
const pw = 'geoserver';
const grc = new GeoServerRestClient(url, user, pw);

const wsToDelete = [
  'cite',
  'it.geosolutions.json', // hack: add .json to get first '.' ignored by GS
  'ne',
  'nurc',
  'sde',
  'sf',
  'tiger',
  'topp'
];

main();

/**
 * Async function containing all demo request
 */
async function main () {
  const recurse = true;
  for (let index = 0; index < wsToDelete.length; index++) {
    const ws = wsToDelete[index];
    console.info('Deleting', ws, '...');
    try {
      await grc.workspaces.delete(ws, recurse);
      console.info('... done');
    } catch (error) {
      console.error(error);
    }
  }

  const defaultStyles = await grc.styles.getDefaults();
  const nonDeletable = [
    'generic',
    'line',
    'point',
    'polygon',
    'raster'
  ];
  const purge = true;
  const defaultStylesArray = defaultStyles.styles.style;
  if (defaultStylesArray) {
    for (let index = 0; index < defaultStylesArray.length; index++) {
      const styleObj = defaultStylesArray[index];
      const styleName = styleObj.name;
      try {
        if (!nonDeletable.includes(styleName)) {
          console.log('Deleting style', styleName);
          await grc.styles.delete(undefined, styleName, recurse, purge);
          console.info('... done');
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}
