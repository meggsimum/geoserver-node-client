import { GeoServerRestClient } from '../geoserver-rest-client.js';

const url = 'http://localhost:8080/geoserver/rest/';
const user = 'admin';
const pw = 'geoserver';
const grc = new GeoServerRestClient(url, user, pw);

const ws = 'test';

function prettyJson(obj) {
  return JSON.stringify(obj, null, 2);
}

main();

/**
 * Async function containing all demo request
 */
async function main() {
  // create a workspace if not existing
  const exists = await grc.workspaces.get(ws);
  if (!exists) {
    console.log('Created GeoServer WS', prettyJson(await grc.workspaces.create(ws)));
  }

  ////////////////////////
  // GEOPACKAGE
  ///////////////////////

  const gpkgFile = '../test/sample_data/iceland.gpkg';
  console.log(
    'GeoServer created GeoPackage store and layer',
    await grc.layers.publishGpkgFromFile(ws, 'my-gpkg-store', gpkgFile)
  );

  ////////////////////////
  // GEOTIFF
  ///////////////////////

  const geotiff = '../test/sample_data/world.tif';
  console.log(
    'GeoServer created GeoTIFF store and layer',
    await grc.layers.publishGeotiffFromFile(ws, 'my-cov-store', 'my-layer-name', geotiff)
  );
}
