/* global describe:false, it:false, afterEach:false */

import { expect } from 'chai';

import { GeoServerRestClient, GeoServerResponseError } from '../../geoserver-rest-client.js';
import { mockFetch } from './helpers/mock-fetch.js';

const url = 'http://gs.test/geoserver/rest/';
const grc = new GeoServerRestClient(url, 'admin', 'geoserver');

const aboutOk = (call) => call.url.endsWith('about/version.json');

let mock;
afterEach(() => mock?.restore());

const bodyOf = (call) => JSON.parse(call.body);

// Tests for code that is most likely broken are only run on demand:
//   RUN_SUSPECTED_BUGS=1 npm run test:unit
const suspectedBug = process.env.RUN_SUSPECTED_BUGS ? it : it.skip;

describe('Regressions and suspected bugs (unit)', () => {
  it('settings.updateProxyBaseUrl returns false for malformed settings', async () => {
    mock = mockFetch(() => ({ body: {} }));
    expect(await grc.settings.updateProxyBaseUrl('http://x')).to.equal(false);
  });

  it('styles.getAllWorkspaceStyles returns [] if there is no workspace', async () => {
    // GeoServer answers with an empty string instead of an object
    mock = mockFetch(() => ({ body: { workspaces: '' } }));
    expect(await grc.styles.getAllWorkspaceStyles()).to.deep.equal([]);
  });

  it('layergroups.create uses sensible default bounds', async () => {
    mock = mockFetch(() => ({ status: 201, headers: { location: 'http://gs.test/lg' } }));
    await grc.layergroups.create('ws', 'lg', ['l']);
    const { bounds } = bodyOf(mock.calls[0]).layerGroup;
    expect(bounds).to.deep.include({ minx: -180, maxx: 180, miny: -90, maxy: 90 });
  });

  it('layergroups.create reports a failed creation', async () => {
    mock = mockFetch((call) =>
      aboutOk(call) ? { body: { about: {} } } : { status: 409, body: 'already exists' }
    );
    let error;
    try {
      await grc.layergroups.create('ws', 'lg', ['l']);
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(GeoServerResponseError);
  });

  suspectedBug('delete methods send recurse=false if recurse is omitted', async () => {
    mock = mockFetch(() => ({}));
    await grc.workspaces.delete('ws');
    await grc.layers.deleteFeatureType('ws', 'st', 'ft');
    await grc.datastores.deleteDataStore('ws', 'st');
    await grc.datastores.deleteCoverageStore('ws', 'cs');
    for (const call of mock.calls) {
      expect(call.url, call.url).to.match(/recurse=false$/);
    }
  });

  suspectedBug('layers.publishDbRaster applies the documented defaults', async () => {
    mock = mockFetch(() => ({}));
    await grc.layers.publishDbRaster('ws', 'cs', 'native');
    expect(bodyOf(mock.calls[0]).coverage).to.include({ srs: 'EPSG:4326', enabled: true });
  });

  suspectedBug('layers.publishFeatureType does not mutate the given bounding box', async () => {
    mock = mockFetch(() => ({}));
    const bbox = { minx: 1, miny: 2, maxx: 3, maxy: 4 };
    await grc.layers.publishFeatureType('ws', 'st', 'n', 'n', 't', 'EPSG:4326', true, '', bbox);
    expect(bbox).to.deep.equal({ minx: 1, miny: 2, maxx: 3, maxy: 4 });
  });
});

describe('Delete URLs (unit)', () => {
  it('styles.delete normalizes recurse and purge', async () => {
    mock = mockFetch(() => ({}));
    await grc.styles.delete('ws', 's');
    await grc.styles.delete(undefined, 's', true, true);
    await grc.styles.delete('ws', 's', 'yes', 1);

    expect(mock.calls.map((c) => c.method)).to.deep.equal(['DELETE', 'DELETE', 'DELETE']);
    expect(mock.calls[0].url).to.equal(url + 'workspaces/ws/styles/s?purge=false&recurse=false');
    expect(mock.calls[1].url).to.equal(url + 'styles/s?purge=true&recurse=true');
    // only the boolean `true` counts
    expect(mock.calls[2].url).to.equal(url + 'workspaces/ws/styles/s?purge=false&recurse=false');
  });

  it('styles.delete explains a 403', async () => {
    mock = mockFetch(() => ({ status: 403, body: 'forbidden' }));
    let error;
    try {
      await grc.styles.delete('ws', 's');
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(GeoServerResponseError);
    expect(error.message).to.contain('dependant layers');
    expect(error.geoServerOutput).to.equal('forbidden');
  });

  it('workspaces.delete passes recurse and maps 400 and 404', async () => {
    mock = mockFetch(() => ({}));
    await grc.workspaces.delete('ws', true);
    expect(mock.calls[0].url).to.equal(url + 'workspaces/ws?recurse=true');
    mock.restore();

    const messages = {};
    for (const status of [400, 404, 500]) {
      mock = mockFetch(() => ({ status, body: 'x' }));
      try {
        await grc.workspaces.delete('ws', false);
      } catch (e) {
        messages[status] = e.message;
      }
      mock.restore();
    }
    expect(messages[400]).to.contain('not empty');
    expect(messages[404]).to.contain("doesn't exist");
    expect(messages[500]).to.equal('GeoServer Response Error');
  });
});

describe('Layer request bodies (unit)', () => {
  it('publishFeatureType: applies defaults', async () => {
    mock = mockFetch(() => ({}));
    await grc.layers.publishFeatureType('ws', 'st', 'native');

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.equal(url + 'workspaces/ws/datastores/st/featuretypes');
    expect(bodyOf(call)).to.deep.equal({
      featureType: {
        nativeName: 'native',
        name: 'native',
        title: 'native',
        srs: 'EPSG:4326',
        enabled: true,
        abstract: ''
      }
    });
  });

  it('publishFeatureType: title falls back to name, enabled=false is respected', async () => {
    mock = mockFetch(() => ({}));
    await grc.layers.publishFeatureType(
      'ws',
      'st',
      'native',
      'name',
      undefined,
      'EPSG:3857',
      false
    );

    const { featureType } = bodyOf(mock.calls[0]);
    expect(featureType.name).to.equal('name');
    expect(featureType.title).to.equal('name');
    expect(featureType.srs).to.equal('EPSG:3857');
    expect(featureType.enabled).to.equal(false);
  });

  it('publishFeatureType: adds the CRS to a native bounding box without one', async () => {
    mock = mockFetch(() => ({}));
    const bbox = { minx: 1, miny: 2, maxx: 3, maxy: 4 };
    await grc.layers.publishFeatureType('ws', 'st', 'n', 'n', 't', 'EPSG:25832', true, '', bbox);

    expect(bodyOf(mock.calls[0]).featureType.nativeBoundingBox).to.deep.equal({
      minx: 1,
      miny: 2,
      maxx: 3,
      maxy: 4,
      crs: { '@class': 'projected', $: 'EPSG:25832' }
    });
  });

  it('publishFeatureType: keeps a given CRS', async () => {
    mock = mockFetch(() => ({}));
    const crs = { '@class': 'geographic', $: 'EPSG:4326' };
    await grc.layers.publishFeatureType('ws', 'st', 'n', 'n', 't', 'EPSG:4326', true, '', {
      minx: 1,
      miny: 2,
      maxx: 3,
      maxy: 4,
      crs
    });
    expect(bodyOf(mock.calls[0]).featureType.nativeBoundingBox.crs).to.deep.equal(crs);
  });

  it('publishFeatureTypeDefaultDataStore: posts to the workspace', async () => {
    mock = mockFetch(() => ({}));
    await grc.layers.publishFeatureTypeDefaultDataStore('ws', 'native', 'n', 'T', 'EPSG:3857');

    expect(mock.calls[0].url).to.equal(url + 'workspaces/ws/featuretypes');
    expect(bodyOf(mock.calls[0]).featureType).to.include({
      nativeName: 'native',
      name: 'n',
      title: 'T',
      srs: 'EPSG:3857',
      enabled: true
    });
  });

  it('publishWmsLayer: applies defaults', async () => {
    mock = mockFetch(() => ({}));
    await grc.layers.publishWmsLayer('ws', 'wms', 'native');

    expect(mock.calls[0].url).to.equal(url + 'workspaces/ws/wmsstores/wms/wmslayers');
    expect(bodyOf(mock.calls[0]).wmsLayer).to.deep.equal({
      nativeName: 'native',
      name: 'native',
      title: 'native',
      srs: 'EPSG:4326',
      enabled: true,
      abstract: ''
    });
  });

  it('renameCoverageBands: sends one dimension per band name', async () => {
    mock = mockFetch(() => ({}));
    await grc.layers.renameCoverageBands('ws', 'cs', 'layer', ['r', 'g', 'b']);

    const [call] = mock.calls;
    expect(call.method).to.equal('PUT');
    expect(call.url).to.equal(url + 'workspaces/ws/coveragestores/cs/coverages/layer.json');
    expect(bodyOf(call)).to.deep.equal({
      coverage: { dimensions: { coverageDimension: [{ name: 'r' }, { name: 'g' }, { name: 'b' }] } }
    });
  });

  it('enableTimeCoverage: builds the time dimension and defaults the presentation', async () => {
    mock = mockFetch(() => ({}));
    await grc.layers.enableTimeCoverage('ws', 'cs', 'c', undefined, 3600000, 'MAXIMUM');

    const [call] = mock.calls;
    expect(call.method).to.equal('PUT');
    expect(call.url).to.equal(url + 'workspaces/ws/coveragestores/cs/coverages/c.json');
    const [entry] = bodyOf(call).coverage.metadata.entry;
    expect(entry['@key']).to.equal('time');
    expect(entry.dimensionInfo).to.deep.include({
      enabled: true,
      presentation: 'DISCRETE_INTERVAL',
      resolution: 3600000,
      units: 'ISO8601',
      defaultValue: { strategy: 'MAXIMUM' }
    });
  });

  it('enableTimeFeatureType: builds the time dimension with attribute', async () => {
    mock = mockFetch(() => ({}));
    await grc.layers.enableTimeFeatureType(
      'ws',
      'st',
      'ft',
      'timestamp',
      'LIST',
      60000,
      'NEAREST',
      true,
      false,
      'PT30M'
    );

    const [call] = mock.calls;
    expect(call.url).to.equal(url + 'workspaces/ws/datastores/st/featuretypes/ft.json');
    const [entry] = bodyOf(call).featureType.metadata.entry;
    expect(entry.dimensionInfo).to.deep.equal({
      attribute: 'timestamp',
      presentation: 'LIST',
      resolution: 60000,
      units: 'ISO8601',
      defaultValue: { strategy: 'NEAREST' },
      nearestMatchEnabled: true,
      rawNearestMatchEnabled: false,
      acceptableInterval: 'PT30M'
    });
  });

  it('modifyAttribution: reads the layer, changes only given fields and puts it back', async () => {
    const layer = { layer: { name: 'l', attribution: { title: 'old', href: 'http://old' } } };
    mock = mockFetch((call) => (call.method === 'GET' ? { body: layer } : {}));
    await grc.layers.modifyAttribution('ws', 'l', 'new title');

    expect(mock.calls).to.have.length(2);
    expect(mock.calls[0].url).to.equal(url + 'layers/ws:l.json');
    expect(mock.calls[1].method).to.equal('PUT');
    expect(mock.calls[1].url).to.equal(url + 'layers/ws:l.json');
    expect(bodyOf(mock.calls[1]).layer.attribution).to.deep.equal({
      title: 'new title',
      href: 'http://old'
    });
  });

  it('modifyAttribution: fails if the layer has no attribution', async () => {
    mock = mockFetch(() => ({ body: { layer: { name: 'l' } } }));
    let error;
    try {
      await grc.layers.modifyAttribution('ws', 'l', 'x');
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(GeoServerResponseError);
    expect(error.message).to.contain("misses the property 'attribution'");
    expect(mock.calls).to.have.length(1); // no PUT
  });
});

describe('Layers chained via href (unit)', () => {
  it('getFeatureTypeFromLayer follows layer.resource.href', async () => {
    const href = 'http://other-host.test/geoserver/rest/workspaces/ws/featuretypes/ft.json';
    mock = mockFetch((call) =>
      call.url === href
        ? { body: { featureType: { name: 'ft' } } }
        : { body: { layer: { resource: { href } } } }
    );
    const result = await grc.layers.getFeatureTypeFromLayer('ws', 'ft');

    expect(result.featureType.name).to.equal('ft');
    expect(mock.calls[1].url).to.equal(href);
  });

  it('getFeatureTypeFromLayer fails without resource.href', async () => {
    mock = mockFetch(() => ({ body: { layer: {} } }));
    let error;
    try {
      await grc.layers.getFeatureTypeFromLayer('ws', 'ft');
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(GeoServerResponseError);
    expect(error.message).to.contain('layer.resource.href');
  });

  it('getDataStore fails if the feature type has no store', async () => {
    const href = 'http://gs.test/ft.json';
    mock = mockFetch((call) =>
      call.url === href
        ? { body: { featureType: {} } }
        : { body: { layer: { resource: { href } } } }
    );
    let error;
    try {
      await grc.layers.getDataStore('ws', 'ft');
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(GeoServerResponseError);
    expect(error.message).to.contain('lacks a feature type');
  });

  it('getCoverageStore fails if the coverage has no store', async () => {
    mock = mockFetch(() => ({ body: { coverage: {} } }));
    let error;
    try {
      await grc.layers.getCoverageStore('ws', 'c');
    } catch (e) {
      error = e;
    }
    expect(error).to.be.instanceOf(GeoServerResponseError);
    expect(error.message).to.contain('lacks a coverage');
  });
});

describe('Settings (unit)', () => {
  it('updateContactInformation maps positional arguments to GeoServer fields', async () => {
    mock = mockFetch(() => ({}));
    await grc.settings.updateContactInformation(
      'street 1',
      'Berlin',
      'Germany',
      '10115',
      'BE',
      'a@b.test',
      'Org',
      'Person',
      '12345'
    );

    const [call] = mock.calls;
    expect(call.method).to.equal('PUT');
    expect(call.url).to.equal(url + 'settings/contact');
    expect(bodyOf(call)).to.deep.equal({
      contact: {
        address: 'street 1',
        addressCity: 'Berlin',
        addressCountry: 'Germany',
        addressPostalCode: '10115',
        addressState: 'BE',
        contactEmail: 'a@b.test',
        contactOrganization: 'Org',
        contactPerson: 'Person',
        contactVoice: '12345'
      }
    });
  });

  it('updateContactInformation omits undefined fields', async () => {
    mock = mockFetch(() => ({}));
    await grc.settings.updateContactInformation('street 1');
    expect(bodyOf(mock.calls[0])).to.deep.equal({ contact: { address: 'street 1' } });
  });

  it('updateProxyBaseUrl reads the settings, changes the URL and writes them back', async () => {
    const settings = { global: { settings: { verbose: true } } };
    mock = mockFetch((call) => (call.method === 'GET' ? { body: settings } : {}));
    await grc.settings.updateProxyBaseUrl('http://proxy.test/geoserver');

    expect(mock.calls[1].method).to.equal('PUT');
    expect(mock.calls[1].url).to.equal(url + 'settings');
    expect(bodyOf(mock.calls[1]).global.settings).to.deep.equal({
      verbose: true,
      proxyBaseUrl: 'http://proxy.test/geoserver'
    });
  });

  it('updateWmsSettings rejects an invalid object without any request', async () => {
    mock = mockFetch(() => ({}));
    for (const invalid of [undefined, null, {}, { foo: 1 }]) {
      let error;
      try {
        await grc.settings.updateWmsSettings(invalid);
      } catch (e) {
        error = e;
      }
      expect(error, JSON.stringify(invalid)).to.be.instanceOf(GeoServerResponseError);
      expect(error.message).to.equal('Invalid WMS settings object');
    }
    expect(mock.calls).to.have.length(0);
  });

  it('updateWmsSrsLimitation creates the srs section if it is missing', async () => {
    mock = mockFetch((call) => (call.method === 'GET' ? { body: { wms: { name: 'WMS' } } } : {}));
    await grc.settings.updateWmsSrsLimitation(['EPSG:4326', 'EPSG:3857']);

    expect(mock.calls[1].method).to.equal('PUT');
    expect(mock.calls[1].url).to.equal(url + 'services/wms/settings.json');
    expect(bodyOf(mock.calls[1]).wms).to.deep.equal({
      name: 'WMS',
      srs: { string: ['EPSG:4326', 'EPSG:3857'] }
    });
  });

  it('updateWmsSrsLimitation keeps other srs properties', async () => {
    const wms = { wms: { srs: { other: 1, string: ['EPSG:25832'] } } };
    mock = mockFetch((call) => (call.method === 'GET' ? { body: wms } : {}));
    await grc.settings.updateWmsSrsLimitation(['EPSG:4326']);
    expect(bodyOf(mock.calls[1]).wms.srs).to.deep.equal({ other: 1, string: ['EPSG:4326'] });
  });
});

describe('Layergroup creation and workspace styles (unit)', () => {
  const request = async (invoke) => {
    try {
      await invoke();
    } catch (e) {
      return e;
    }
  };

  it('layergroups.create explains a 409 and keeps the GeoServer output', async () => {
    mock = mockFetch(() => ({ status: 409, body: 'already exists' }));
    const error = await request(() => grc.layergroups.create('ws', 'lg', ['l']));

    expect(error).to.be.instanceOf(GeoServerResponseError);
    expect(error.message).to.equal('Unable to add layergroup as it already exists');
    expect(error.geoServerOutput).to.equal('already exists');
  });

  it('layergroups.create throws a generic error for other failures', async () => {
    mock = mockFetch(() => ({ status: 500, body: 'boom' }));
    const error = await request(() => grc.layergroups.create('ws', 'lg', ['l']));

    expect(error).to.be.instanceOf(GeoServerResponseError);
    expect(error.message).to.equal('GeoServer Response Error');
    expect(error.geoServerOutput).to.equal('boom');
  });

  it('layergroups.create returns the location of the new layergroup', async () => {
    mock = mockFetch(() => ({ status: 201, headers: { location: 'http://gs.test/lg' } }));
    expect(await grc.layergroups.create('ws', 'lg', ['l'])).to.equal('http://gs.test/lg');
  });

  it('layergroups.create: explicit bounds replace the defaults', async () => {
    mock = mockFetch(() => ({ status: 201 }));
    const bounds = { minx: 1, miny: 2, maxx: 3, maxy: 4, crs: 'EPSG:3857' };
    await grc.layergroups.create('ws', 'lg', ['l'], { bounds });
    expect(bodyOf(mock.calls[0]).layerGroup.bounds).to.deep.equal(bounds);
  });

  it('styles.getAll without workspaces returns only the default styles', async () => {
    mock = mockFetch((call) => {
      if (call.url.endsWith('workspaces.json')) return { body: { workspaces: '' } };
      return { body: { styles: { style: [{ name: 'point' }, { name: 'line' }] } } };
    });
    expect(await grc.styles.getAll()).to.deep.equal([{ name: 'point' }, { name: 'line' }]);
  });

  it('styles.getAllWorkspaceStyles still rejects a malformed answer', async () => {
    for (const body of [{}, { workspaces: { workspace: 'not-an-array' } }, { workspaces: null }]) {
      mock = mockFetch(() => ({ body }));
      const error = await request(() => grc.styles.getAllWorkspaceStyles());
      mock.restore();

      expect(error, JSON.stringify(body)).to.be.instanceOf(GeoServerResponseError);
      expect(error.message).to.contain('malformed');
    }
  });

  it('settings.updateProxyBaseUrl sends nothing for malformed settings', async () => {
    mock = mockFetch(() => ({ body: { global: {} } }));
    expect(await grc.settings.updateProxyBaseUrl('http://x')).to.equal(false);
    expect(mock.calls.map((c) => c.method)).to.deep.equal(['GET']);
  });
});
