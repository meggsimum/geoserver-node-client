/* global describe:false, it:false, afterEach:false, Response:false */

import { expect } from 'chai';

import { GeoServerRestClient, GeoServerResponseError } from '../../geoserver-rest-client.js';
import AboutClient from '../../src/about.js';
import { httpPost, httpPut, getGeoServerResponseText } from '../../src/util/geoserver.js';
import { mockFetch, geoServerUpButNotFound, geoServerDown } from './helpers/mock-fetch.js';

const url = 'http://gs.test/geoserver/rest/';
const grc = new GeoServerRestClient(url, 'admin', 'geoserver');

let mock;
afterEach(() => mock?.restore());

describe('GeoServerRestClient (unit)', () => {
  it('appends a trailing slash to the URL', () => {
    const client = new GeoServerRestClient('http://gs.test/geoserver/rest', 'u', 'p');
    expect(client.url).to.equal('http://gs.test/geoserver/rest/');
  });

  it('keeps an existing trailing slash', () => {
    expect(grc.url).to.equal(url);
  });

  it('builds the Basic auth string', () => {
    const expected = 'Basic ' + Buffer.from('admin:geoserver').toString('base64');
    expect(grc.auth).to.equal(expected);
  });

  it('hands the same url and auth to all sub clients', () => {
    const subClients = [
      'layers',
      'layergroups',
      'styles',
      'workspaces',
      'namespaces',
      'datastores',
      'imagemosaics',
      'security',
      'settings',
      'about',
      'resetReload'
    ];
    for (const name of subClients) {
      expect(grc[name], name).to.be.an('object');
      expect(grc[name].url, `${name}.url`).to.equal(grc.url);
      expect(grc[name].auth, `${name}.auth`).to.equal(grc.auth);
    }
  });

  it('sends the auth header with requests', async () => {
    mock = mockFetch(() => ({ body: { about: {} } }));
    await grc.about.getVersion();
    expect(mock.calls[0].headers.Authorization).to.equal(grc.auth);
  });
});

describe('GeoServerResponseError (unit)', () => {
  it('is an Error with name, message and GeoServer output', () => {
    const error = new GeoServerResponseError('boom', '<html>details</html>');
    expect(error).to.be.instanceOf(Error);
    expect(error.name).to.equal('GeoServerResponseError');
    expect(error.message).to.equal('boom');
    expect(error.geoServerOutput).to.equal('<html>details</html>');
  });

  it('falls back to a default message', () => {
    expect(new GeoServerResponseError(null, 'x').message).to.equal('GeoServer Response Error');
    expect(new GeoServerResponseError().message).to.equal('GeoServer Response Error');
  });
});

describe('HTTP helpers (unit)', () => {
  it('httpPost sets method, credentials and duplex and keeps other options', async () => {
    mock = mockFetch(() => ({}));
    await httpPost('http://gs.test/x', { body: 'abc', headers: { A: 'b' } });

    const { init } = mock.calls[0];
    expect(init.method).to.equal('POST');
    expect(init.credentials).to.equal('include');
    expect(init.duplex).to.equal('half');
    expect(init.body).to.equal('abc');
    expect(init.headers).to.deep.equal({ A: 'b' });
  });

  it('httpPut sets method, credentials and duplex', async () => {
    mock = mockFetch(() => ({}));
    await httpPut('http://gs.test/x', { body: 'abc' });

    const { init } = mock.calls[0];
    expect(init.method).to.equal('PUT');
    expect(init.credentials).to.equal('include');
    expect(init.duplex).to.equal('half');
  });

  it('getGeoServerResponseText returns the response text', async () => {
    const text = await getGeoServerResponseText(new Response('some text'));
    expect(text).to.equal('some text');
  });

  it('getGeoServerResponseText returns undefined if reading the text throws', async () => {
    const broken = {
      text: () => {
        throw new Error('stream broken');
      }
    };
    expect(await getGeoServerResponseText(broken)).to.be.undefined;
  });
});

describe('AboutClient.exists (unit)', () => {
  const about = new AboutClient(url, grc.auth);

  it('is true if the version endpoint answers', async () => {
    mock = mockFetch(() => ({ body: { about: { resource: [] } } }));
    expect(await about.exists()).to.equal(true);
    expect(mock.calls[0].url).to.equal(url + 'about/version.json');
  });

  it('is false on an error status', async () => {
    mock = mockFetch(geoServerDown);
    expect(await about.exists()).to.equal(false);
  });

  it('is false if the request itself fails', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed');
    };
    mock = { restore: () => (globalThis.fetch = original) };
    expect(await about.exists()).to.equal(false);
  });
});

// Many methods answer "not found" with `undefined`, but only if GeoServer
// itself is reachable (checked via a second request to about/version.json).
const getters = [
  ['workspaces.get', () => grc.workspaces.get('ws'), 'workspaces/ws.json'],
  ['layers.get', () => grc.layers.get('ws', 'l'), 'layers/ws:l.json'],
  ['layers.get (no workspace)', () => grc.layers.get(undefined, 'l'), 'layers/l.json'],
  [
    'layers.getWmsLayer',
    () => grc.layers.getWmsLayer('ws', 'st', 'l'),
    'workspaces/ws/wmsstores/st/wmslayers/l.json'
  ],
  [
    'layers.getWmtsLayer',
    () => grc.layers.getWmtsLayer('ws', 'st', 'l'),
    'workspaces/ws/wmtsstores/st/layers/l.json'
  ],
  [
    'layers.getFeatureType',
    () => grc.layers.getFeatureType('ws', 'st', 'ft'),
    'workspaces/ws/datastores/st/featuretypes/ft.json'
  ],
  [
    'layers.getCoverage',
    () => grc.layers.getCoverage('ws', 'cs', 'c'),
    'workspaces/ws/coveragestores/cs/coverages/c.json'
  ],
  [
    'datastores.getDataStore',
    () => grc.datastores.getDataStore('ws', 'st'),
    'workspaces/ws/datastores/st.json'
  ],
  [
    'datastores.getCoverageStore',
    () => grc.datastores.getCoverageStore('ws', 'st'),
    'workspaces/ws/coveragestores/st.json'
  ],
  [
    'datastores.getWmsStore',
    () => grc.datastores.getWmsStore('ws', 'st'),
    'workspaces/ws/wmsstores/st.json'
  ],
  [
    'datastores.getWmtsStore',
    () => grc.datastores.getWmtsStore('ws', 'st'),
    'workspaces/ws/wmtsstores/st.json'
  ],
  [
    'styles.getStyleInformation',
    () => grc.styles.getStyleInformation('ws', 's'),
    'workspaces/ws/styles/s.json'
  ],
  [
    'styles.getStyleInformation (no workspace)',
    () => grc.styles.getStyleInformation(undefined, 's'),
    'styles/s.json'
  ]
];

describe('"Not found" handling (unit)', () => {
  for (const [name, invoke, path] of getters) {
    it(`${name}: undefined on 404 if GeoServer is reachable`, async () => {
      mock = mockFetch(geoServerUpButNotFound);
      expect(await invoke()).to.be.undefined;
      expect(mock.calls[0].url).to.equal(url + path);
      expect(mock.calls[1].url).to.equal(url + 'about/version.json');
    });

    it(`${name}: throws if GeoServer is not reachable`, async () => {
      mock = mockFetch(geoServerDown);
      let error;
      try {
        await invoke();
      } catch (e) {
        error = e;
      }
      expect(error).to.be.instanceOf(GeoServerResponseError);
      expect(error.geoServerOutput).to.equal('Service Unavailable');
    });
  }
});
