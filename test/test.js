/* global describe:false, it:false, before:false, after:false */
/* eslint-disable no-unused-expressions */
import { expect } from 'chai';
import GeoServerRestClient from '../geoserver-rest-client.js';

const url = 'http://localhost:8080/geoserver/rest/';
const user = 'admin';
const pw = 'geoserver';
const grc = new GeoServerRestClient(url, user, pw);

const workSpace = 'my-workspace';

const nameSpace = 'my-namespace';
const nameSpaceUri = 'http://www.example.com';

const geoServerVersion = process.env.GEOSERVER_VERSION;

describe('Basic GeoServer', () => {
  it('should exist', async () => {
    const result = await grc.exists();
    expect(result).to.be.true;
  });

  it('returns correct version', async () => {
    const result = await grc.getVersion();
    expect(result.about.resource[0].Version).to.equal(geoServerVersion);
  })
});

describe('Settings', () => {
  after(async () => {
    await grc.settings.updateSettings({
      global: {
        settings: {
          verbose: true
        }
      }
    });
    await grc.settings.updateProxyBaseUrl('');
  });

  it('returns settings object', async () => {
    const settings = await grc.settings.getSettings();
    expect(settings).to.not.be.false;
    expect(settings.global.settings.charset).to.not.be.false;
  })

  it('updates settings object', async () => {
    const settingsJson = {
      global: {
        settings: {
          verbose: false
        }
      }
    };
    const updateOk = await grc.settings.updateSettings(settingsJson);
    expect(updateOk).to.be.true;

    const settings = await grc.settings.getSettings();
    expect(settings.global.settings.verbose).to.equal(settingsJson.global.settings.verbose);
  })

  it('updates proxyBaseUrl', async () => {
    const url = 'http://foobar.de/geoserver';
    const updateOk = await grc.settings.updateProxyBaseUrl(url);
    expect(updateOk).to.be.true;

    const settings = await grc.settings.getSettings();
    expect(settings.global.settings.proxyBaseUrl).to.equal(url);
  })

  it('returns contact information', async () => {
    const contactInfo = await grc.settings.getContactInformation();
    expect(contactInfo).to.not.be.false;
  })

  it('can update contact information', async () => {
    const address = 'Unter den Linden';
    const city = 'Berlin';
    const country = 'Deutschland';
    const postalCode = 123445;
    const state = 'Berlin';
    const email = 'example email address';
    const organization = 'A organization';
    const contactPerson = 'My contact persion';
    const phoneNumber = 1231234234123;

    const result = await grc.settings.updateContactInformation(address, city, country, postalCode, state, email, organization, contactPerson, phoneNumber);
    expect(result).to.be.true;

    const contactResponse = await grc.settings.getContactInformation();

    // test two sample values
    expect(address).to.equal(contactResponse.contact.address);
    expect(state).to.equal(contactResponse.contact.addressState);
  })
});

describe('Workspace', () => {
  it('has no workspace', async () => {
    const gsWorkspaces = await grc.workspaces.getAll();
    expect(gsWorkspaces.workspaces).to.equal('');
  });

  it('creates one workspace', async () => {
    const result = await grc.workspaces.create(workSpace);
    expect(result).to.equal(workSpace);
  });

  it('has one workspace', async () => {
    const gsWorkspaces = await grc.workspaces.getAll();
    expect(gsWorkspaces.workspaces.workspace.length).to.equal(1);
    expect(gsWorkspaces.workspaces.workspace[0].name).to.equal(workSpace);
  });

  it('query dedicated workspace', async () => {
    const gsWorkspace = await grc.workspaces.get(workSpace);
    expect(gsWorkspace.workspace.name).to.equal(workSpace);
  });

  it('delete workspace', async () => {
    const recursive = true;
    const result = await grc.workspaces.delete(workSpace, recursive);
    expect(result).to.be.true;
  });

  it('has no workspace', async () => {
    const gsWorkspaces = await grc.workspaces.getAll();
    expect(gsWorkspaces.workspaces).to.equal('');
  });
});

describe('Namespace', () => {
  it('has no namespaces', async () => {
    const gsNamespaces = await grc.namespaces.getAll();
    expect(gsNamespaces.namespaces).to.equal('');
  });

  it('creates one namespace', async () => {
    const result = await grc.namespaces.create(nameSpace, nameSpaceUri);
    expect(result).to.equal(nameSpace);
  });

  it('has one namespace', async () => {
    const gsNameSpaces = await grc.namespaces.getAll();
    expect(gsNameSpaces.namespaces.namespace.length).to.equal(1);
    expect(gsNameSpaces.namespaces.namespace[0].name).to.equal(nameSpace);
  });

  it('query dedicated namespace', async () => {
    const gsNameSpace = await grc.namespaces.get(nameSpace);
    expect(gsNameSpace.namespace.prefix).to.equal(nameSpace);
    expect(gsNameSpace.namespace.uri).to.equal(nameSpaceUri);
  });

  it('delete namespace', async () => {
    const result = await grc.namespaces.delete(nameSpace);
    expect(result).to.be.true;
  });

  it('has no namespace', async () => {
    const gsNameSpaces = await grc.namespaces.getAll();
    expect(gsNameSpaces.namespaces).to.equal('');
  });
});

describe('Datastore', () => {
  let createdWorkSpace;

  before('create workspace', async () => {
    createdWorkSpace = await grc.workspaces.create(workSpace);
  });

  // TODO: test PostGIS store
  // TODO: test image mosaic
  // TODO: test WMTS-Stores

  // TODO: copy test data to GeoServer before
  it('can create GeoTIFF', async () => {
    const geotiff = 'test/sample_data/world.geotiff'
    const result = await grc.datastores.createGeotiffFromFile(
      workSpace,
      'my-rasterstore',
      'my-raster-name',
      'My Raster Title',
      geotiff);
    expect(result).to.not.be.false;
  });

  it('can create a WMS Store', async () => {
    // TODO: make sure the WMS actually exists
    const wmsUrl = 'https://ows.terrestris.de/osm/service?';
    const result = await grc.datastores.createWmsStore(
      workSpace,
      'my-wms-datastore',
      wmsUrl);
    expect(result).to.not.be.false;
  });

  it('can create a WFS Store', async () => {
    // TODO: make sure the WFS actually exists
    const wfsCapsUrl = 'https://ows-demo.terrestris.de/geoserver/osm/wfs?service=wfs&version=1.1.0&request=GetCapabilities';
    const namespaceUrl = 'http://test';
    const result = await grc.datastores.createWfsStore(
      workSpace,
      'my-wfs-datastore',
      wfsCapsUrl,
      namespaceUrl);
    expect(result).to.be.true;
  });

  // TODO: copy test data to GeoServer
  it('can create a GeoPackage Store', async () => {
    const gpkg = 'test/sample_data/iceland.gpkg'
    const result = await grc.datastores.createGpkgStore(
      workSpace,
      'my-gpkg-store',
      gpkg)
    expect(result).to.be.true;
  });

  it('can retrive the data stores', async () => {
    const result = await grc.datastores.getDataStores(workSpace);
    const dataStores = result.dataStores.dataStore;
    expect(dataStores.length).to.equal(2);
  });

  it('can retrive the coverage stores', async () => {
    const result = await grc.datastores.getCoverageStores(workSpace);
    const coverageStores = result.coverageStores.coverageStore;
    expect(coverageStores.length).to.equal(1);
  });

  it('can retrive the WMS stores', async () => {
    const result = await grc.datastores.getWmsStores(workSpace);
    const wmsStores = result.wmsStores.wmsStore;
    expect(wmsStores.length).to.equal(1);
  });

  after('delete Workspace', async () => {
    const recursive = true;
    await grc.workspaces.delete(createdWorkSpace, recursive);
  });
});

describe('Layer', () => {
  let createdWorkSpace;
  const wmsLayerName = 'my-wms-layer-name';
  const featureLayerName = 'my-feature-layer-name'
  const wfsDataStore = 'my-wfs-datastore';

  before('create workspace', async () => {
    createdWorkSpace = await grc.workspaces.create(workSpace);
  });

  it('can publish a FeatureType', async () => {
    const wfsCapsUrl = 'https://ows-demo.terrestris.de/geoserver/osm/wfs?service=wfs&version=1.1.0&request=GetCapabilities';
    const namespaceUrl = 'http://test';
    const dataStoreResult = await grc.datastores.createWfsStore(
      workSpace,
      wfsDataStore,
      wfsCapsUrl,
      namespaceUrl
    );
    expect(dataStoreResult).to.be.true;

    const result = await grc.layers.publishFeatureType(
      workSpace,
      wfsDataStore,
      'osm_osm-country-borders',
      featureLayerName,
      'My Feature title',
      'EPSG:4326',
      true,
      'Sample Abstract'
    );
    expect(result).to.be.true;
  });

  it('can publish a FeatureType with explicit native BBOX', async () => {
    const ftName = featureLayerName + '_native_bbox';
    const nativeBoundingBox = {
      minx: 8.15,
      maxx: 8.16,
      miny: 50.0,
      maxy: 50.1
    };

    const result = await grc.layers.publishFeatureType(
      workSpace,
      wfsDataStore,
      'osm_osm-country-borders',
      ftName,
      'My Feature title native BBOX',
      'EPSG:4326',
      true,
      'Sample Abstract native BBOX',
      nativeBoundingBox
    );
    expect(result).to.be.true;
  });

  it('can publish a WMS layer', async () => {
    // TODO: make sure WMS url is still working
    const wmsUrl = 'https://ows.terrestris.de/osm/service?';
    const wmsDataStore = 'my-wms-datastore';
    const wmsStoreResult = await grc.datastores.createWmsStore(
      workSpace,
      wmsDataStore,
      wmsUrl);

    expect(wmsStoreResult).to.be.true;
    const result = await grc.layers.publishWmsLayer(
      workSpace,
      wmsDataStore,
      'OSM-Overlay-WMS',
      wmsLayerName,
      'My WMS Title',
      'EPSG:900913',
      true,
      'Sample Abstract'
    );
    expect(result).to.be.true;
  })

  it('can modify the attribution', async () => {
    const attributionText = 'sample attribution';
    const attributionLink = 'http://www.example.com';

    const attributionResult = await grc.layers.modifyAttribution(`${workSpace}:${wmsLayerName}`, attributionText, attributionLink);

    const layerProperties = await grc.layers.get(`${workSpace}:${wmsLayerName}`);

    expect(attributionResult).to.be.true;
    expect(layerProperties.layer.attribution.title).to.equal(attributionText);
    expect(layerProperties.layer.attribution.href).to.equal(attributionLink);
  })

  it('can get retrieve all layers', async () => {
    const result = await grc.layers.getAll();
    expect(result.layers.layer.length).to.equal(3);
  })

  it('can get a layer by qualified name', async () => {
    const nonExistentLayer = 'non-existent-layer';
    let result = await grc.layers.get(workSpace + ':' + nonExistentLayer);
    expect(result).to.be.false;

    result = await grc.layers.get(workSpace + ':' + wmsLayerName);
    expect(result.layer.name).to.equal(wmsLayerName);
  })

  // TODO: publishFeatureTypeDefaultDataStore

  it('can delete a feature type', async () => {
    const recursive = true;
    const result = await grc.layers.deleteFeatureType(
      workSpace,
      wfsDataStore,
      featureLayerName,
      recursive
    );
    expect(result).to.be.true;
  })

  it('has function to query coverages', async () => {
    // query a non-existing coverage to check that the function exists
    // TODO test valid response once we have coverages in test setup
    const result = await grc.layers.getCoverage(workSpace, 'testCovStore', 'testCoverage');
    expect(result).to.be.false;
  })

  after('delete Workspace', async () => {
    const recursive = true;
    await grc.workspaces.delete(createdWorkSpace, recursive);
  });
});

describe('style', () => {
  let createdWorkSpace;
  const styleName = 'my-style-name';
  const featureLayerName = 'my-feature-layer-name'
  const wfsDataStore = 'my-wfs-datastore';

  before('create workspace', async () => {
    createdWorkSpace = await grc.workspaces.create(workSpace);
  });

  it('can get default styles', async () => {
    const result = await grc.styles.getDefaults();
    expect(result.styles.style.length).to.equal(5)
  })

  it('can publish a style', async () => {
    const sldBody = '<?xml version="1.0" encoding="UTF-8"?>\n<StyledLayerDescriptor version="1.0.0" \n xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" \n xmlns="http://www.opengis.net/sld" \n xmlns:ogc="http://www.opengis.net/ogc" \n xmlns:xlink="http://www.w3.org/1999/xlink" \n xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n  <NamedLayer>\n    <Name>default_line</Name>\n    <UserStyle>\n  <Title>Default Line</Title>\n      <Abstract>A sample style that draws a line</Abstract>\n   <FeatureTypeStyle>\n        <Rule>\n          <Name>rule1</Name>\n          <Title>Blue Line</Title>\n          <Abstract>A solid blue line with a 1 pixel width</Abstract>\n          <LineSymbolizer>\n            <Stroke>\n              <CssParameter name="stroke">#0000FF</CssParameter>\n            </Stroke>\n          </LineSymbolizer>\n        </Rule>\n      </FeatureTypeStyle>\n    </UserStyle>\n  </NamedLayer>\n</StyledLayerDescriptor>\n';

    const result = await grc.styles.publish(
      workSpace,
      styleName,
      sldBody
    );
    expect(result).to.be.true;
  })

  it('can get all styles', async () => {
    const result = await grc.styles.getAll();
    expect(result.length).to.equal(6)
  })

  it('can assign a style to a layer', async () => {
    const wfsCapsUrl = 'https://ows-demo.terrestris.de/geoserver/osm/wfs?service=wfs&version=1.1.0&request=GetCapabilities';
    const namespaceUrl = 'http://test';

    const dataStoreResult = await grc.datastores.createWfsStore(
      workSpace,
      wfsDataStore,
      wfsCapsUrl,
      namespaceUrl
    );
    expect(dataStoreResult).to.be.true;

    const layerResult = await grc.layers.publishFeatureType(
      workSpace,
      wfsDataStore,
      'osm_osm-country-borders',
      featureLayerName,
      'My Feature title',
      'EPSG:4326',
      true
    );
    expect(layerResult).to.be.true;

    const qualifiedName = workSpace + ':' + featureLayerName;
    const workspaceStyle = workSpace;
    const isDefaultStyle = true;
    const result = await grc.styles.assignStyleToLayer(qualifiedName, styleName, workspaceStyle, isDefaultStyle);
    expect(result).to.be.true;
  });

  it('can get style information', async () => {
    const result = await grc.styles.getStyleInformation(styleName, workSpace);
    expect(result.style.name).to.equal(styleName);
  })

  it('can get styles in specific workspace', async () => {
    const result = await grc.styles.getInWorkspace(workSpace);
    expect(result.styles.style.length).to.equal(1);
  })

  it('can get styles in all workspaces', async () => {
    const result = await grc.styles.getAllWorkspaceStyles();
    expect(result.length).to.equal(1);
  })

  it('can delete a style', async () => {
    let recurse = false;
    const purge = false;
    const withOutRecurse = await grc.styles.delete(workSpace, styleName, recurse, purge)
    expect(withOutRecurse).to.be.false;

    recurse = true;
    const withRecurse = await grc.styles.delete(workSpace, styleName, recurse, purge)
    expect(withRecurse).to.be.true;
  });

  after('delete Workspace', async () => {
    const recursive = true;
    await grc.workspaces.delete(createdWorkSpace, recursive);
  });
});

describe('Security', () => {
  let createdWorkSpace;

  const dummyUser = 'dummyUser';
  const dummyPassword = 'dummyPassword';

  before('create workspace', async () => {
    createdWorkSpace = await grc.workspaces.create(workSpace);
  });

  it('can create a user', async () => {
    const result = await grc.security.createUser(dummyUser, dummyPassword);
    expect(result).to.be.true;
  })

  it('can associate a user role', async () => {
    const result = await grc.security.associateUserRole(dummyUser, 'ADMIN');
    expect(result).to.be.true;
  })

  it('can update a user', async () => {
    const enabled = false;
    const result = await grc.security.updateUser(dummyUser, dummyPassword, enabled);
    expect(result).to.be.true;
  })

  after(async () => {
    const recursive = true;
    await grc.workspaces.delete(createdWorkSpace, recursive);
  });
});
