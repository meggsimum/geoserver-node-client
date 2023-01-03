import { GeoServerRestClient } from './geoserver-rest-client.js';
import fetch from 'node-fetch';

const url = 'http://localhost:8080/geoserver/rest/';
const user = 'admin';
const pw = 'geoserver';
const grc = new GeoServerRestClient(url, user, pw);

main();


async function main() {
  // const nsPrefix = 'demo';
  // const nsUri = 'http://www.example.com'

  // console.log(
  //   'Created GeoServer NS',
  //   await grc.namespaces.create(nsPrefix, nsUri).catch(() => { })
  // );

  // const coverageStore = 'cog_mosaic';
  // const zipArchivePath = 'test/sample_data/image-mosaic-conf/image-mosaic-conf.zip';
  // const configure = false;

  // await grc.datastores.createImageMosaicStore(nsPrefix, coverageStore, zipArchivePath, configure);

  // await grc.imagemosaics.addGranuleByRemoteFile(nsPrefix, coverageStore, 'http://nginx/cog/20220101T0100Z.tif');

  // await grc.datastores.initCoverageStore(nsPrefix, coverageStore);

  // const presentation = 'LIST';
  // const resolution = 3600000;
  // const defaultValue = 'MAXIMUM';
  // const nearestMatchEnabled = true;
  // const rawNearestMatchEnabled = false;
  // const acceptableInterval = 'PT1H';

  // await grc.layers.enableTimeCoverageForCogLayer(nsPrefix, coverageStore, coverageStore, presentation, resolution, defaultValue, nearestMatchEnabled, rawNearestMatchEnabled, acceptableInterval);

  // await grc.imagemosaics.addGranuleByRemoteFile(nsPrefix, coverageStore, 'http://nginx/cog/20220101T0200Z.tif');
  // await grc.imagemosaics.addGranuleByRemoteFile(nsPrefix, coverageStore, 'http://nginx/cog/20220101T0300Z.tif');
  // await grc.imagemosaics.addGranuleByRemoteFile(nsPrefix, coverageStore, 'http://nginx/cog/20220101T0400Z.tif');


  const response = await fetch('http://localhost:8080/geoserver/ows?service=wms&version=1.3.0&request=GetCapabilities');
  const text = await response.text()
  console.log(text);
  const b = text.includes('2022-01-01T01:00:00.000Z,2022-01-01T02:00:00.000Z,2022-01-01T03:00:00.000Z,2022-01-01T04:00:00.000Z')
  console.log(b);
}

