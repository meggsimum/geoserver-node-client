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
    const result = await grc.about.exists();
    expect(result).to.be.true;
  });

  it('returns correct version', async () => {
    const result = await grc.about.getVersion();
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
    await grc.settings.updateSettings(settingsJson);

    const settings = await grc.settings.getSettings();
    expect(settings.global.settings.verbose).to.equal(settingsJson.global.settings.verbose);
  })

  it('updates proxyBaseUrl', async () => {
    const url = 'http://foobar.de/geoserver';
    await grc.settings.updateProxyBaseUrl(url);

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

    await grc.settings.updateContactInformation(address, city, country, postalCode, state, email, organization, contactPerson, phoneNumber);

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
    await grc.workspaces.create(workSpace);
  });

  it('has one workspace', async () => {
    const gsWorkspaces = await grc.workspaces.getAll();
    expect(gsWorkspaces.workspaces.workspace.length).to.equal(1);
    expect(gsWorkspaces.workspaces.workspace[0].name).to.equal(workSpace);
  });

  it('query dedicated workspace', async () => {
    const gsWorkspace = await grc.workspaces.get(workSpace);
    expect(gsWorkspace.workspace.name).to.equal(workSpace);

    expect(
      await grc.workspaces.get('fantasyWorkspace')
    ).to.be.undefined;
  });

  it('delete workspace', async () => {
    const recursive = true;
    await grc.workspaces.delete(workSpace, recursive);
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
    await grc.namespaces.create(nameSpace, nameSpaceUri);
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
    expect(
      await grc.namespaces.get('fantasyNamespace')
    ).to.be.undefined;
  });

  it('delete namespace', async () => {
    await grc.namespaces.delete(nameSpace);
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

  it('can create a coverage store', async () => {
    const geotiff = 'test/sample_data/world.geotiff'
    await grc.datastores.createGeotiffFromFile(
      workSpace,
      'my-rasterstore',
      'my-raster-name',
      'My Raster Title',
      geotiff);
  });

  it('can create a WMS Store', async () => {
    // TODO: make sure the WMS actually exists
    const wmsUrl = 'https://ows.terrestris.de/osm/service?';
    await grc.datastores.createWmsStore(
      workSpace,
      'my-wms-datastore',
      wmsUrl);
  });

  it('can create a WFS Store', async () => {
    // TODO: make sure the WFS actually exists
    const wfsCapsUrl = 'https://ows-demo.terrestris.de/geoserver/osm/wfs?service=wfs&version=1.1.0&request=GetCapabilities';
    const namespaceUrl = 'http://test';
    await grc.datastores.createWfsStore(
      workSpace,
      'my-wfs-datastore',
      wfsCapsUrl,
      namespaceUrl);
  });

  // TODO: copy test data to GeoServer
  it('can create a GeoPackage Store', async () => {
    const gpkg = 'test/sample_data/iceland.gpkg'
    await grc.datastores.createGpkgStore(
      workSpace,
      'my-gpkg-store',
      gpkg)
  });

  it('returns undefined for not existent stores ', async () => {
    expect(
      await grc.datastores.getDataStore(workSpace, 'fantasyStore')
    ).to.be.undefined;
    expect(
      await grc.datastores.getCoverageStore(workSpace, 'fantasyStore')
    ).to.be.undefined;
    expect(
      await grc.datastores.getWmsStore(workSpace, 'fantasyStore')
    ).to.be.undefined;
    expect(
      await grc.datastores.getWmtsStore(workSpace, 'fantasyStore')
    ).to.be.undefined;
  });

  it('can retrieve the data stores', async () => {
    const result = await grc.datastores.getDataStores(workSpace);
    const dataStores = result.dataStores.dataStore;
    expect(dataStores.length).to.equal(2);
  });

  it('can retrieve the coverage stores', async () => {
    const result = await grc.datastores.getCoverageStores(workSpace);
    const coverageStores = result.coverageStores.coverageStore;
    expect(coverageStores.length).to.equal(1);
  });

  it('can retrieve the WMS stores', async () => {
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
  const rasterStoreName = 'my-rasterstore';
  const rasterLayerName = 'my-raster-name';

  before('create workspace', async () => {
    createdWorkSpace = await grc.workspaces.create(workSpace);
  });

  it('can publish a FeatureType', async () => {
    const wfsCapsUrl = 'https://ows-demo.terrestris.de/geoserver/osm/wfs?service=wfs&version=1.1.0&request=GetCapabilities';
    const namespaceUrl = 'http://test';
    await grc.datastores.createWfsStore(
      workSpace,
      wfsDataStore,
      wfsCapsUrl,
      namespaceUrl
    );

    await grc.layers.publishFeatureType(
      workSpace,
      wfsDataStore,
      'osm_osm-country-borders',
      featureLayerName,
      'My Feature title',
      'EPSG:4326',
      true,
      'Sample Abstract'
    );
  });

  it('can read information of a FeatureType', async () => {
    const layerInfo = await grc.layers.getFeatureType(workSpace, wfsDataStore, featureLayerName);
    expect(layerInfo.featureType.name).to.equal(featureLayerName);
  });

  it('can publish a FeatureType with explicit native BBOX', async () => {
    const ftName = featureLayerName + '_native_bbox';
    const nativeBoundingBox = {
      minx: 8.15,
      maxx: 8.16,
      miny: 50.0,
      maxy: 50.1
    };

    await grc.layers.publishFeatureType(
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
  });

  it('can publish a WMS layer', async () => {
    // TODO: make sure WMS url is still working
    const wmsUrl = 'https://ows.terrestris.de/osm/service?';
    const wmsDataStore = 'my-wms-datastore';
    await grc.datastores.createWmsStore(
      workSpace,
      wmsDataStore,
      wmsUrl);

    await grc.layers.publishWmsLayer(
      workSpace,
      wmsDataStore,
      'OSM-Overlay-WMS',
      wmsLayerName,
      'My WMS Title',
      'EPSG:900913',
      true,
      'Sample Abstract'
    );
  })

  it('can modify the attribution', async () => {
    const attributionText = 'sample attribution';
    const attributionLink = 'http://www.example.com';

    await grc.layers.modifyAttribution(workSpace, wmsLayerName, attributionText, attributionLink);

    const layerProperties = await grc.layers.get(workSpace, wmsLayerName);

    expect(layerProperties.layer.attribution.title).to.equal(attributionText);
    expect(layerProperties.layer.attribution.href).to.equal(attributionLink);
  })

  it('can get retrieve all layers', async () => {
    const result = await grc.layers.getAll();
    expect(result.layers.layer.length).to.equal(3);
  })

  it('can get a layer by name and workspace', async () => {
    const nonExistentLayer = 'non-existent-layer';
    const nonExistentResult = await grc.layers.get(workSpace, nonExistentLayer);
    expect(nonExistentResult).to.be.undefined;

    const result = await grc.layers.get(workSpace, wmsLayerName);
    expect(result.layer.name).to.equal(wmsLayerName);
  })

  // TODO: publishFeatureTypeDefaultDataStore

  it('can delete a feature type', async () => {
    const recursive = true;
    await grc.layers.deleteFeatureType(
      workSpace,
      wfsDataStore,
      featureLayerName,
      recursive
    );
  })

  it('can create Coverage layer', async () => {
    const geotiff = 'test/sample_data/world.geotiff'
    await grc.datastores.createGeotiffFromFile(
      workSpace,
      rasterStoreName,
      rasterLayerName,
      'My Raster Title',
      geotiff);
  });

  it('can query coverages', async () => {
    const nonExistentLayer = 'non-existent-layer';
    const nonExistentResult = await grc.layers.getCoverage(workSpace, rasterStoreName, nonExistentLayer);
    expect(nonExistentResult).to.be.undefined;

    const result = await grc.layers.getCoverage(workSpace, rasterStoreName, rasterLayerName);
    expect(result.coverage.name).to.equal(rasterLayerName);
  })

  it('can rename band names of a coverage', async () => {
    const bandNames = ['one', 'two', 'three', 'four'];
    await grc.layers.renameCoverageBands(workSpace, rasterStoreName, rasterLayerName, bandNames);
    const result = await grc.layers.getCoverage(workSpace, rasterStoreName, rasterLayerName);
    const bandResult = result.coverage.dimensions.coverageDimension;
    expect(bandResult.length).to.equal(4);
    expect(bandResult[3].name).to.equal(bandNames[3]);
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

    await grc.styles.publish(
      workSpace,
      styleName,
      sldBody
    );
  })

  it('can get all styles', async () => {
    const result = await grc.styles.getAll();
    expect(result.length).to.equal(6)
  })

  it('can assign a style to a layer', async () => {
    const wfsCapsUrl = 'https://ows-demo.terrestris.de/geoserver/osm/wfs?service=wfs&version=1.1.0&request=GetCapabilities';
    const namespaceUrl = 'http://test';

    await grc.datastores.createWfsStore(
      workSpace,
      wfsDataStore,
      wfsCapsUrl,
      namespaceUrl
    );

    await grc.layers.publishFeatureType(
      workSpace,
      wfsDataStore,
      'osm_osm-country-borders',
      featureLayerName,
      'My Feature title',
      'EPSG:4326',
      true
    );

    const workspaceStyle = workSpace;

    // case: style shall **not** be default style
    const isDefaultStyle = false;
    const layerInfo1 = await grc.layers.get(workSpace, featureLayerName)
    const defaultStyleNameBefore = layerInfo1.layer.defaultStyle.name;

    await grc.styles.assignStyleToLayer(workSpace, featureLayerName, workspaceStyle, styleName, isDefaultStyle);

    const layerInfo2 = await grc.layers.get(workSpace, featureLayerName)
    const defaultStyleNameAfter = layerInfo2.layer.defaultStyle.name;
    // we check if the default style of before has not changed
    expect(defaultStyleNameBefore).to.equal(defaultStyleNameAfter);

    const associatedStyleName = layerInfo2.layer.styles.style[0].name;
    const inputStyleQualifiedName = `${workspaceStyle}:${styleName}`
    // we check if the new style got associated with the layer
    expect(associatedStyleName).to.equal(inputStyleQualifiedName);

    // case: style shall be default style (default behavior)
    await grc.styles.assignStyleToLayer(workSpace, featureLayerName, workspaceStyle, styleName);

    const layerInfo3 = await grc.layers.get(workSpace, featureLayerName)
    const changedDefaultStyleName = layerInfo3.layer.defaultStyle.name;
    // we check if the default style got updated
    expect(changedDefaultStyleName).to.equal(inputStyleQualifiedName);
  });

  it('can get style information', async () => {
    const result = await grc.styles.getStyleInformation(workSpace, styleName);
    expect(result.style.name).to.equal(styleName);
    expect(
      await grc.styles.getStyleInformation(workSpace, 'fantasyStyle')
    ).to.be.undefined;
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
    const purge = false;
    let recurse = false;
    try {
      await grc.styles.delete(workSpace, styleName, recurse, purge);
    } catch (error) {
      expect(error.name).to.equal('GeoServerResponseError');
    }

    recurse = true;
    await grc.styles.delete(workSpace, styleName, recurse, purge)
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
    await grc.security.createUser(dummyUser, dummyPassword);
  })

  it('can associate a user role', async () => {
    await grc.security.associateUserRole(dummyUser, 'ADMIN');
  })

  it('can update a user', async () => {
    const enabled = false;
    await grc.security.updateUser(dummyUser, dummyPassword, enabled);
  })

  after(async () => {
    const recursive = true;
    await grc.workspaces.delete(createdWorkSpace, recursive);
  });
});
