import { GeoServerRestClient } from '../geoserver-rest-client.js';

const url = 'http://localhost:8080/geoserver/rest/';
const user = 'admin';
const pw = 'geoserver';
const grc = new GeoServerRestClient(url, user, pw);

// const ws = 'test';

function prettyJson (obj) {
  return JSON.stringify(obj, null, 2);
}

main();

/**
 * Async function containing all demo request
 */
async function main () {
  try {
    // GENERAL

    console.log(
      'GeoServer REST exists',
      await grc.about.exists()
    );

    console.log(
      'GeoServer REST version info',
      prettyJson(await grc.about.getVersion())
    );

    // NAMESPACES

    // const nsPrefix = 'example-namespace';
    // const nsUri = 'http://www.example.com'

    // console.log(
    //   'Created GeoServer NS',
    //   await grc.namespaces.create(nsPrefix, nsUri)
    //   );

    // console.log(
    //   'GeoServer All NS',
    //   prettyJson(await grc.namespaces.getAll())
    // );

    // console.log(
    //   'GeoServer NS',
    //   prettyJson(await grc.namespaces.get(nsPrefix))
    // );

    // console.log(
    //   'Deleted GeoServer NS',
    //   await grc.namespaces.delete(nsPrefix)
    // );

    // WORKSPACES

    // console.log(
    //   'GeoServer All WS',
    //   prettyJson(await grc.workspaces.getAll())
    // );

    // console.log(
    //   'Created GeoServer WS',
    //   prettyJson(await grc.workspaces.create(ws))
    // );

    // const recursive = true;
    // console.log(
    //   'Deleted GeoServer WS',
    //   await grc.workspaces.delete(ws, recursive)
    // );

    // DATASTORES

    // console.log(
    //   'GeoServer data stores in WS', ws,
    //   prettyJson(await grc.datastores.getDataStores(ws))
    // );

    // console.log(
    //   'GeoServer coverage stores in WS', ws,
    //   prettyJson(await grc.datastores.getCoverageStores(ws))
    // );

    // console.log(
    //   'GeoServer WMS stores in WS', ws,
    //   prettyJson(await grc.datastores.getWmsStores(ws))
    // );

    // console.log(
    //   'GeoServer WMTS stores in WS', ws,
    //   prettyJson(await grc.datastores.getWmtsStores(ws))
    // );

    // console.log(
    //   'GeoServer data store ',
    //   prettyJson(await grc.datastores.getDataStore(ws, 'foo'))
    // );

    // console.log(
    //   'GeoServer coverage store ',
    //   prettyJson(await grc.datastores.getCoverageStore(ws, 'foo'))
    // );

    // console.log(
    //   'GeoServer wms store ',
    //   prettyJson(await grc.datastores.getWmsStore(ws, 'foo'))
    // );

    // console.log(
    //   'GeoServer wmts store ',
    //   prettyJson(await grc.datastores.getWmtsStore(ws, 'foo'))
    // );

    // const geotiff = 'world.tif';
    // console.log(
    //   'GeoServer create GeoTIFF',
    //   await grc.datastores.createGeotiffFromFile('test', 'my-cov-store', 'my-layer-name', 'my-layer-title', geotiff)
    // );

    // console.log(
    //   'Created Image Mosaic Store',
    //    await grc.datastores.createImageMosaicStore('image_mosaics', 'myname', '/path/to/properties.zip')
    // );

    // console.log(
    //   'Deleted coverage store',
    //   await grc.datastores.deleteCoverageStore('test', 'my-cov-store', true)
    // );

    // const wmsUrl = 'https://ows.terrestris.de/osm/service?';
    // console.log(
    //   'Created WMS data store',
    //   await grc.datastores.createWmsStore(ws, 'testWmsDs', wmsUrl)
    // );

    // const wfsCapsUrl = 'https://services.meggsimum.de/geoserver/ows?service=wfs&version=1.1.0&request=GetCapabilities';
    // const namespaceUrl = 'http://test';
    // console.log(
    //   'Created WFS data store',
    //   await grc.datastores.createWfsStore(ws, 'testWfsDs', wfsCapsUrl, namespaceUrl, false)
    // );

    // console.log(
    //   'Deleted data store',
    //   await grc.datastores.deleteDataStore(ws, 'testWfsDs', false)
    // );

    // const gpkgPath = 'world.gpkg';
    // console.log(
    //   'Created GPKG Store',
    //   await grc.datastores.createGpkgStore(ws, 'testGpkgStore', gpkgPath)
    // );

    // LAYERS

    // console.log(
    //   'GeoServer layer by workspace and name',
    //   prettyJson(await grc.layers.get('fooWs','barLayer'))
    // );

    // console.log(
    //   'Band names\n',
    //   await grc.layers.renameCoverageBands('dummy-ws','pfalz', 'pfalz_multiband', ['eins', 'zwei'])
    // );

    // console.log(
    //   'All GeoServer layers',
    //   prettyJson(await grc.layers.getAll())
    // );

    // console.log(
    //   'Created Layer',
    //   prettyJson(await grc.layers.publishFeatureTypeDefaultDataStore(ws, 'nativeFtName', 'aTestName', 'Test Title', 'EPSG:31468', false))
    // );

    // console.log(
    //   'Created Layer',
    //   await grc.layers.publishFeatureType(ws, 'testdataStore', 'nativeFtName', 'aTestName2', 'Test Title 2', 'EPSG:31468', true)
    // );

    // const nativeBoundingBox = {
    //   minx: 8.15,
    //   maxx: 8.16,
    //   miny: 50.0,
    //   maxy: 50.1,
    //   crs: {
    //     '@class': 'projected',
    //     $: 'EPSG:4326'
    //   }
    // };
    // console.log(
    //   'Created FT with explicit native BBOX',
    //   await grc.layers.publishFeatureType(ws, 'testdataStore', 'nativeFtName', 'aTestNameBbox', 'Test Title Bbox', 'EPSG:4326', true, null, nativeBoundingBox)
    // );

    // console.log(
    //   prettyJson(await grc.layers.getFeatureType(ws, 'testdataStore', 'testName'))
    // );

    // console.log(
    //   'Created WMS Layer',
    //   await grc.layers.publishWmsLayer(ws, 'testWmsDs', 'OSM-Overlay-WMS', 'aTestName4Wms', 'Test Title WMS', 'EPSG:900913', true)
    // );

    // console.log(
    //   'Created DB Raster Layer',
    //   await grc.layers.publishDbRaster(ws, 'testdataStore', 'nativeRasterName', 'a-db-raster', 'Dummy DB Raster Title', null, true)
    // );

    // console.log(
    //   'Deleted Layer',
    //   await grc.layers.deleteFeatureType(ws, 'testdataStore', 'aTestName2', true)
    // );

    // console.log(
    //   'Enabled time for layer',
    //   await grc.layers.enableTimeCoverage(ws, 'testDs', 'HymptyLayer', 'DISCRETE_INTERVAL', 3600000, 'MAXIMUM')
    // )

    // console.log(
    //   'Get Coverage',
    //   prettyJson(await grc.layers.getCoverage(ws, 'testCovStore', 'testCoverage'))
    // );

    // STYLES

    // console.log(
    //   'GeoServer default styles',
    //   prettyJson(await grc.styles.getDefaults())
    // );

    // console.log(
    //   'GeoServer styles for WS',
    //   prettyJson(await grc.styles.getInWorkspace(ws))
    // );

    // console.log(
    //   'GeoServer all WS styles',
    //   prettyJson(await grc.styles.getAllWorkspaceStyles())
    // );

    // console.log(
    //   'GeoServer all styles',
    //   prettyJson(await grc.styles.getAll())
    // );

    // const sldBody = '<?xml version="1.0" encoding="UTF-8"?>\n<StyledLayerDescriptor version="1.0.0" \n xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" \n xmlns="http://www.opengis.net/sld" \n xmlns:ogc="http://www.opengis.net/ogc" \n xmlns:xlink="http://www.w3.org/1999/xlink" \n xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n  <NamedLayer>\n    <Name>default_line</Name>\n    <UserStyle>\n  <Title>Default Line</Title>\n      <Abstract>A sample style that draws a line</Abstract>\n   <FeatureTypeStyle>\n        <Rule>\n          <Name>rule1</Name>\n          <Title>Blue Line</Title>\n          <Abstract>A solid blue line with a 1 pixel width</Abstract>\n          <LineSymbolizer>\n            <Stroke>\n              <CssParameter name="stroke">#0000FF</CssParameter>\n            </Stroke>\n          </LineSymbolizer>\n        </Rule>\n      </FeatureTypeStyle>\n    </UserStyle>\n  </NamedLayer>\n</StyledLayerDescriptor>\n';
    // console.log(
    //   'Publish GeoServer style',
    //   await grc.styles.publish(ws, 'testStyle3', sldBody)
    // );

    // IMAGEMOSAIC

    // console.log(
    //   'Get Granules Image Mosaic',
    //   prettyJson(await grc.imagemosaics.getGranules('imagemosaic_test', 'testCovStore', 'testCov'))
    // );

    // const filePathCoverages = 'file:///opt/raster_data';
    // console.log(
    //   'Harveset Granules Image Mosaic',
    //   prettyJson(await grc.imagemosaics.harvestGranules('imagemosaic_test', 'testCovStore', filePathCoverages))
    // );

    // const coverageToAdd = 'file:///opt/raster_data/a.tif'
    // console.log(
    //   'Add Granule by Server File',
    //   await grc.imagemosaics.addGranuleByServerFile('imagemosaic_test', 'testCovStore', coverageToAdd)
    // );

    // const coverageToDelete = '/opt/raster_data/a.tif';
    // console.log(
    //   'Deleting Granule',
    //   await grc.imagemosaics.deleteSingleGranule('imagemosaic_test', 'testCovStore', 'testCov', coverageToDelete)
    // );
  } catch (error) {
    console.error('#### Error message #####');
    console.error(error.message);

    console.error('#### Whole Error Object #####');
    console.error(error);
  }
}
