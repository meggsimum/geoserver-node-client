/* global describe:false, it:false, afterEach:false */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';

import { expect } from 'chai';

import { GeoServerRestClient, GeoServerResponseError } from '../../geoserver-rest-client.js';
import { mockFetch, geoServerUpButNotFound } from './helpers/mock-fetch.js';

const url = 'http://gs.test/geoserver/rest/';
const grc = new GeoServerRestClient(url, 'admin', 'geoserver');

let mock;
afterEach(() => mock?.restore());

const bodyOf = (call) => JSON.parse(call.body);

const headerOf = (call, name) =>
  Object.entries(call.headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];

/** Runs `invoke` and returns the thrown error (or undefined). */
const thrown = async (invoke) => {
  try {
    await invoke();
  } catch (e) {
    return e;
  }
};

/** Expects `invoke` to fail with a GeoServerResponseError for the given response. */
const expectFailure = async (invoke, response, message) => {
  mock = mockFetch(() => response);
  const error = await thrown(invoke);
  mock.restore();

  expect(error, `${response.status}`).to.be.instanceOf(GeoServerResponseError);
  expect(error.message).to.equal(message);
  expect(error.geoServerOutput).to.equal(response.body);
};

const GENERIC = 'GeoServer Response Error';

/** Destroys the file streams used as request bodies and waits until they are closed. */
const closeStreams = (calls) =>
  Promise.all(
    calls.map(
      (call) =>
        new Promise((resolve) => {
          call.body.once('close', resolve);
          call.body.destroy();
        })
    )
  );

// ---------------------------------------------------------------------------
// Plain GET methods that answer with JSON and throw on errors
// ---------------------------------------------------------------------------

const plainGetters = [
  ['workspaces.getAll', () => grc.workspaces.getAll(), 'workspaces.json'],
  ['namespaces.getAll', () => grc.namespaces.getAll(), 'namespaces.json'],
  ['layers.getAll', () => grc.layers.getAll(), 'layers.json'],
  ['layers.getLayers', () => grc.layers.getLayers('ws'), 'workspaces/ws/layers.json'],
  ['styles.getDefaults', () => grc.styles.getDefaults(), 'styles.json'],
  ['styles.getInWorkspace', () => grc.styles.getInWorkspace('ws'), 'workspaces/ws/styles.json'],
  ['security.getAllUsers', () => grc.security.getAllUsers(), 'security/usergroup/users.json'],
  ['security.getAllRoles', () => grc.security.getAllRoles(), 'security/roles.json'],
  [
    'security.getAllAccessRules',
    () => grc.security.getAllAccessRules(),
    'security/acl/layers.json'
  ],
  ['settings.getSettings', () => grc.settings.getSettings(), 'settings.json'],
  [
    'settings.getContactInformation',
    () => grc.settings.getContactInformation(),
    'settings/contact'
  ],
  ['settings.getWmsSettings', () => grc.settings.getWmsSettings(), 'services/wms/settings.json'],
  ['about.getVersion', () => grc.about.getVersion(), 'about/version.json'],
  [
    'datastores.getDataStores',
    () => grc.datastores.getDataStores('ws'),
    'workspaces/ws/datastores.json'
  ],
  [
    'datastores.getCoverageStores',
    () => grc.datastores.getCoverageStores('ws'),
    'workspaces/ws/coveragestores.json'
  ],
  [
    'datastores.getWmsStores',
    () => grc.datastores.getWmsStores('ws'),
    'workspaces/ws/wmsstores.json'
  ],
  [
    'datastores.getWmtsStores',
    () => grc.datastores.getWmtsStores('ws'),
    'workspaces/ws/wmtsstores.json'
  ],
  [
    'imagemosaics.getGranules',
    () => grc.imagemosaics.getGranules('ws', 'cs', 'c'),
    'workspaces/ws/coveragestores/cs/coverages/c/index/granules.json'
  ]
];

describe('Plain GET methods (unit)', () => {
  for (const [name, invoke, path] of plainGetters) {
    it(`${name}: GETs ${path} and returns the JSON`, async () => {
      mock = mockFetch(() => ({ body: { answer: 42 } }));
      expect(await invoke()).to.deep.equal({ answer: 42 });

      expect(mock.calls).to.have.length(1);
      expect(mock.calls[0].method).to.equal('GET');
      expect(mock.calls[0].url).to.equal(url + path);
      expect(headerOf(mock.calls[0], 'authorization')).to.equal(grc.auth);
    });

    it(`${name}: throws with the GeoServer output on an error`, async () => {
      await expectFailure(invoke, { status: 500, body: 'oops' }, GENERIC);
    });
  }
});

// ---------------------------------------------------------------------------
// Workspaces and namespaces
// ---------------------------------------------------------------------------

describe('Workspaces (unit)', () => {
  it('create: posts the workspace, reads it back and returns its name', async () => {
    mock = mockFetch((call) =>
      call.method === 'POST' ? { status: 201 } : { body: { workspace: { name: 'ws' } } }
    );
    expect(await grc.workspaces.create('ws')).to.equal('ws');

    const [post, get] = mock.calls;
    expect(post.method).to.equal('POST');
    expect(post.url).to.equal(url + 'workspaces');
    expect(headerOf(post, 'content-type')).to.equal('application/json');
    expect(bodyOf(post)).to.deep.equal({ workspace: { name: 'ws' } });
    expect(get.method).to.equal('GET');
    expect(get.url).to.equal(url + 'workspaces/ws.json');
  });

  it('create: explains a 409', async () => {
    await expectFailure(
      () => grc.workspaces.create('ws'),
      { status: 409, body: 'exists' },
      'Unable to add workspace as it already exists'
    );
  });

  it('create: other errors are generic', async () => {
    await expectFailure(() => grc.workspaces.create('ws'), { status: 500, body: 'boom' }, GENERIC);
  });
});

describe('Namespaces (unit)', () => {
  it('create: posts prefix and uri and returns the response text', async () => {
    mock = mockFetch(() => ({ status: 201, body: 'my-namespace' }));
    expect(await grc.namespaces.create('my-namespace', 'http://www.example.com')).to.equal(
      'my-namespace'
    );

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.equal(url + 'namespaces');
    expect(bodyOf(call)).to.deep.equal({
      namespace: { prefix: 'my-namespace', uri: 'http://www.example.com' }
    });
  });

  it('create: throws on an error', async () => {
    await expectFailure(
      () => grc.namespaces.create('p', 'u'),
      { status: 500, body: 'boom' },
      GENERIC
    );
  });

  it('get: undefined on 404 if GeoServer is reachable', async () => {
    mock = mockFetch(geoServerUpButNotFound);
    expect(await grc.namespaces.get('fantasy')).to.be.undefined;
    expect(mock.calls[0].url).to.equal(url + 'namespaces/fantasy.json');
  });

  it('delete: DELETEs the namespace', async () => {
    mock = mockFetch(() => ({}));
    await grc.namespaces.delete('ns');
    expect(mock.calls[0].method).to.equal('DELETE');
    expect(mock.calls[0].url).to.equal(url + 'namespaces/ns');
  });

  const deleteErrors = [
    [403, 'Namespace or related Workspace is not empty (and recurse not true)'],
    [404, "Namespace doesn't exist"],
    [405, "Can't delete default namespace"],
    [500, 'Response not recognized']
  ];
  for (const [status, message] of deleteErrors) {
    it(`delete: maps ${status} to a message`, async () => {
      await expectFailure(() => grc.namespaces.delete('ns'), { status, body: 'x' }, message);
    });
  }
});

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

describe('Security (unit)', () => {
  it('createUser: posts an enabled user', async () => {
    mock = mockFetch(() => ({ status: 201 }));
    await grc.security.createUser('bob', 'secret');

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.equal(url + 'security/usergroup/users.json');
    expect(headerOf(call, 'content-type')).to.equal('application/json');
    expect(bodyOf(call)).to.deep.equal({
      user: { userName: 'bob', password: 'secret', enabled: true }
    });
  });

  it('updateUser: posts password and enabled flag to the user URL', async () => {
    mock = mockFetch(() => ({}));
    await grc.security.updateUser('bob', 'secret', false);

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.equal(url + 'security/usergroup/user/bob');
    expect(bodyOf(call)).to.deep.equal({ user: { password: 'secret', enabled: false } });
  });

  it('deleteUser: DELETEs the user', async () => {
    mock = mockFetch(() => ({}));
    await grc.security.deleteUser('bob');
    expect(mock.calls[0].method).to.equal('DELETE');
    expect(mock.calls[0].url).to.equal(url + 'security/usergroup/user/bob');
  });

  it('createRole: posts without a body', async () => {
    mock = mockFetch(() => ({}));
    await grc.security.createRole('EDITOR');

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.equal(url + 'security/roles/role/EDITOR');
    expect(call.body).to.be.undefined;
    expect(headerOf(call, 'content-type')).to.be.undefined;
  });

  it('deleteRole: DELETEs the role', async () => {
    mock = mockFetch(() => ({}));
    await grc.security.deleteRole('EDITOR');
    expect(mock.calls[0].method).to.equal('DELETE');
    expect(mock.calls[0].url).to.equal(url + 'security/roles/role/EDITOR');
  });

  it('associateUserRole: posts to the role/user URL', async () => {
    mock = mockFetch(() => ({}));
    await grc.security.associateUserRole('bob', 'EDITOR');
    expect(mock.calls[0].method).to.equal('POST');
    expect(mock.calls[0].url).to.equal(url + 'security/roles/role/EDITOR/user/bob');
  });

  it('createDataAccessRule: joins the roles with commas', async () => {
    mock = mockFetch(() => ({}));
    await grc.security.createDataAccessRule('ws.layer.r', ['ADMIN', 'EDITOR']);

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.equal(url + 'security/acl/layers');
    expect(bodyOf(call)).to.deep.equal({ 'ws.layer.r': 'ADMIN,EDITOR' });
  });

  it('deleteDataAccessRule: DELETEs the rule', async () => {
    mock = mockFetch(() => ({}));
    await grc.security.deleteDataAccessRule('ws.layer.r');
    expect(mock.calls[0].method).to.equal('DELETE');
    expect(mock.calls[0].url).to.equal(url + 'security/acl/layers/ws.layer.r');
  });

  const failures = [
    ['createUser', () => grc.security.createUser('bob', 'x'), 'User bob might already exists.'],
    ['createRole', () => grc.security.createRole('R'), 'Role R might already exist.'],
    ['deleteRole', () => grc.security.deleteRole('R'), 'Role R not existing.'],
    [
      'createDataAccessRule',
      () => grc.security.createDataAccessRule('a.b.r', ['X']),
      'Rule a.b.r might already exists.'
    ],
    [
      'deleteDataAccessRule',
      () => grc.security.deleteDataAccessRule('a.b.r'),
      'Rule a.b.r not existing.'
    ]
  ];
  for (const [name, invoke, message] of failures) {
    it(`${name}: maps 404 to a message`, async () => {
      await expectFailure(invoke, { status: 404, body: 'nope' }, message);
    });

    it(`${name}: other errors are generic`, async () => {
      await expectFailure(invoke, { status: 500, body: 'boom' }, GENERIC);
    });
  }

  it('updateUser, deleteUser and associateUserRole throw on errors', async () => {
    await expectFailure(
      () => grc.security.updateUser('b', 'p', true),
      { status: 500, body: 'x' },
      GENERIC
    );
    await expectFailure(() => grc.security.deleteUser('b'), { status: 500, body: 'x' }, GENERIC);
    await expectFailure(
      () => grc.security.associateUserRole('b', 'R'),
      { status: 500, body: 'x' },
      GENERIC
    );
  });
});

// ---------------------------------------------------------------------------
// Datastores
// ---------------------------------------------------------------------------

const entriesOf = (body) =>
  Object.fromEntries(body.dataStore.connectionParameters.entry.map((e) => [e['@key'], e.$]));

describe('Datastores (unit)', () => {
  it('createPostgisStore: builds the connection parameters', async () => {
    mock = mockFetch(() => ({ status: 201 }));
    await grc.datastores.createPostgisStore(
      'ws',
      'http://ns',
      'pg',
      'db-host',
      5432,
      'user',
      'pw',
      'public',
      'demo',
      true
    );

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.equal(url + 'workspaces/ws/datastores');
    const body = bodyOf(call);
    expect(body.dataStore).to.include({ name: 'pg', type: 'PostGIS', enabled: true });
    expect(body.dataStore.workspace).to.deep.equal({ name: 'ws' });
    expect(entriesOf(body)).to.deep.equal({
      dbtype: 'postgis',
      schema: 'public',
      database: 'demo',
      host: 'db-host',
      port: 5432,
      passwd: 'pw',
      namespace: 'http://ns',
      user: 'user',
      'Expose primary keys': true
    });
  });

  it('createPostgisStore: does not expose primary keys by default', async () => {
    mock = mockFetch(() => ({}));
    await grc.datastores.createPostgisStore('ws', 'ns', 'pg', 'h', 5432, 'u', 'p', 'public', 'd');
    expect(entriesOf(bodyOf(mock.calls[0]))['Expose primary keys']).to.equal(false);
  });

  it('createWfsStore: builds the WFS store and enables connection pooling by default', async () => {
    mock = mockFetch(() => ({}));
    await grc.datastores.createWfsStore('ws', 'wfs', 'http://wfs?caps', 'http://ns');

    const [call] = mock.calls;
    expect(call.url).to.equal(url + 'workspaces/ws/datastores');
    const body = bodyOf(call);
    expect(body.dataStore).to.include({ name: 'wfs', type: 'Web Feature Server (NG)' });
    expect(entriesOf(body)).to.deep.equal({
      'WFSDataStoreFactory:GET_CAPABILITIES_URL': 'http://wfs?caps',
      namespace: 'http://ns',
      'WFSDataStoreFactory:USE_HTTP_CONNECTION_POOLING': 'true'
    });
  });

  it('createWfsStore: connection pooling is only disabled by an explicit false', async () => {
    const pooling = async (value) => {
      mock = mockFetch(() => ({}));
      await grc.datastores.createWfsStore('ws', 'wfs', 'http://wfs', 'http://ns', value);
      const result = entriesOf(bodyOf(mock.calls[0]))[
        'WFSDataStoreFactory:USE_HTTP_CONNECTION_POOLING'
      ];
      mock.restore();
      return result;
    };
    expect(await pooling(false)).to.equal('false');
    expect(await pooling(true)).to.equal('true');
    expect(await pooling(undefined)).to.equal('true');
    expect(await pooling(0)).to.equal('true');
  });

  it('createWmsStore: posts name, type and capabilities URL', async () => {
    mock = mockFetch(() => ({}));
    await grc.datastores.createWmsStore('ws', 'wms', 'http://wms?');

    expect(mock.calls[0].url).to.equal(url + 'workspaces/ws/wmsstores');
    expect(bodyOf(mock.calls[0])).to.deep.equal({
      wmsStore: { name: 'wms', type: 'WMS', capabilitiesURL: 'http://wms?' }
    });
  });

  it('createWmtsStore: posts name, type and capabilities URL', async () => {
    mock = mockFetch(() => ({}));
    await grc.datastores.createWmtsStore('ws', 'wmts', 'http://wmts?');

    expect(mock.calls[0].url).to.equal(url + 'workspaces/ws/wmtsstores');
    expect(bodyOf(mock.calls[0])).to.deep.equal({
      wmtsStore: { name: 'wmts', type: 'WMTS', capabilitiesURL: 'http://wmts?' }
    });
  });

  it('createGpkgStore: points to a file in the data dir', async () => {
    mock = mockFetch(() => ({}));
    await grc.datastores.createGpkgStore('ws', 'gpkg', 'data/iceland.gpkg');

    expect(mock.calls[0].url).to.equal(url + 'workspaces/ws/datastores');
    const body = bodyOf(mock.calls[0]);
    expect(body.dataStore).to.include({ name: 'gpkg', type: 'GeoPackage' });
    expect(entriesOf(body)).to.deep.equal({
      database: 'file:data/iceland.gpkg',
      dbtype: 'geopkg'
    });
  });

  it('create*Store methods throw on errors', async () => {
    const calls = [
      () => grc.datastores.createPostgisStore('ws', 'ns', 'n', 'h', 1, 'u', 'p', 's', 'd'),
      () => grc.datastores.createWfsStore('ws', 'n', 'u', 'ns'),
      () => grc.datastores.createWmsStore('ws', 'n', 'u'),
      () => grc.datastores.createWmtsStore('ws', 'n', 'u'),
      () => grc.datastores.createGpkgStore('ws', 'n', 'p')
    ];
    for (const invoke of calls) {
      await expectFailure(invoke, { status: 500, body: 'boom' }, GENERIC);
    }
  });

  it('deleteDataStore: DELETEs with the recurse flag', async () => {
    mock = mockFetch(() => ({}));
    await grc.datastores.deleteDataStore('ws', 'st', true);
    expect(mock.calls[0].method).to.equal('DELETE');
    expect(mock.calls[0].url).to.equal(url + 'workspaces/ws/datastores/st?recurse=true');
  });

  it('deleteDataStore: errors are generic', async () => {
    await expectFailure(
      () => grc.datastores.deleteDataStore('ws', 'st'),
      { status: 500, body: 'x' },
      GENERIC
    );
  });

  it('deleteCoverageStore: DELETEs with the recurse flag', async () => {
    mock = mockFetch(() => ({}));
    await grc.datastores.deleteCoverageStore('ws', 'cs', true);
    expect(mock.calls[0].method).to.equal('DELETE');
    expect(mock.calls[0].url).to.equal(url + 'workspaces/ws/coveragestores/cs?recurse=true');
  });

  it('deleteCoverageStore: explains a 401 and keeps other errors generic', async () => {
    mock = mockFetch(() => ({ status: 401, body: 'x' }));
    const error = await thrown(() => grc.datastores.deleteCoverageStore('ws', 'cs'));
    mock.restore();
    expect(error).to.be.instanceOf(GeoServerResponseError);
    expect(error.message).to.contain('dependant objects');

    await expectFailure(
      () => grc.datastores.deleteCoverageStore('ws', 'cs'),
      { status: 500, body: 'x' },
      GENERIC
    );
  });
});

// ---------------------------------------------------------------------------
// Uploads (only URL, query and headers, GeoServer has to accept the files)
// ---------------------------------------------------------------------------

describe('Uploads (unit)', () => {
  const stream = () => Readable.from(['abc']);

  it('createGeotiffFromStream: puts the stream with file name and coverage name', async () => {
    mock = mockFetch(() => ({ status: 201, body: 'created' }));
    const result = await grc.datastores.createGeotiffFromStream(
      'ws',
      'cs',
      'layer',
      'file',
      stream(),
      3
    );

    expect(result).to.equal('created');
    const [call] = mock.calls;
    expect(call.method).to.equal('PUT');
    expect(call.url).to.equal(
      url + 'workspaces/ws/coveragestores/cs/file.geotiff?filename=file&coverageName=layer'
    );
    expect(headerOf(call, 'content-type')).to.equal('image/tiff');
    expect(headerOf(call, 'content-length')).to.equal(3);
    expect(call.init.duplex).to.equal('half');
  });

  it('createGeotiffFromStream: throws on errors', async () => {
    await expectFailure(
      () => grc.datastores.createGeotiffFromStream('ws', 'cs', 'l', 'f', stream(), 3),
      { status: 500, body: 'boom' },
      GENERIC
    );
  });

  it('createGpkgFromStream: overwrites and optionally sets the file name', async () => {
    mock = mockFetch(() => ({ status: 201 }));
    await grc.datastores.createGpkgFromStream('ws', 'ds', stream(), 3);
    await grc.datastores.createGpkgFromStream('ws', 'ds', stream(), 3, 'my-file');

    expect(mock.calls[0].url).to.equal(
      url + 'workspaces/ws/datastores/ds/file.gpkg?update=overwrite'
    );
    expect(mock.calls[1].url).to.equal(
      url + 'workspaces/ws/datastores/ds/file.gpkg?update=overwrite&filename=my-file'
    );
    expect(mock.calls[0].method).to.equal('PUT');
    expect(headerOf(mock.calls[0], 'content-type')).to.equal('application/x-sqlite3');
    expect(headerOf(mock.calls[0], 'content-length')).to.equal(3);
  });

  it('createImageMosaicStore: puts a zip archive and returns the text', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-unit-'));
    const zip = path.join(dir, 'mosaic.zip');
    fs.writeFileSync(zip, 'zip');

    mock = mockFetch(() => ({ status: 201, body: 'ok' }));
    try {
      expect(await grc.datastores.createImageMosaicStore('ws', 'cs', zip)).to.equal('ok');

      const [call] = mock.calls;
      expect(call.method).to.equal('PUT');
      expect(call.url).to.equal(url + 'workspaces/ws/coveragestores/cs/file.imagemosaic');
      expect(headerOf(call, 'content-type')).to.equal('application/zip');
      await closeStreams([call]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('createGeotiffFromFile and createGpkgFromFile use the size of the file', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-unit-'));
    const file = path.join(dir, 'data.bin');
    fs.writeFileSync(file, '0123456789');

    mock = mockFetch(() => ({ status: 201 }));
    try {
      await grc.datastores.createGeotiffFromFile('ws', 'cs', 'layer', 'file', file);
      await grc.datastores.createGpkgFromFile('ws', 'ds', file, 'name');

      expect(headerOf(mock.calls[0], 'content-length')).to.equal(10);
      expect(headerOf(mock.calls[1], 'content-length')).to.equal(10);
      await closeStreams(mock.calls);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('layers.publishGeotiffFromStream uses the layer name as default file name', async () => {
    mock = mockFetch(() => ({ status: 201 }));
    await grc.layers.publishGeotiffFromStream('ws', 'cs', 'layer', stream(), 3);
    await grc.layers.publishGeotiffFromStream('ws', 'cs', 'layer', stream(), 3, 'other');

    expect(mock.calls[0].url).to.contain('?filename=layer&coverageName=layer');
    expect(mock.calls[1].url).to.contain('?filename=other&coverageName=layer');
  });

  it('layers.publishGpkgFromStream passes the file name on', async () => {
    mock = mockFetch(() => ({ status: 201 }));
    await grc.layers.publishGpkgFromStream('ws', 'ds', stream(), 3, 'name');
    expect(mock.calls[0].url).to.equal(
      url + 'workspaces/ws/datastores/ds/file.gpkg?update=overwrite&filename=name'
    );
  });
});

// ---------------------------------------------------------------------------
// Styles and layergroups
// ---------------------------------------------------------------------------

describe('Styles (unit)', () => {
  it('publish: posts the SLD as XML', async () => {
    mock = mockFetch(() => ({ status: 201 }));
    await grc.styles.publish('ws', 'my-style', '<sld/>');

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.equal(url + 'workspaces/ws/styles?name=my-style');
    expect(headerOf(call, 'content-type')).to.equal('application/vnd.ogc.sld+xml');
    expect(call.body).to.equal('<sld/>');
  });

  it('publish: throws on errors', async () => {
    await expectFailure(
      () => grc.styles.publish('ws', 's', '<sld/>'),
      { status: 500, body: 'x' },
      GENERIC
    );
  });

  const styleInfo = { style: { name: 'my-style', workspace: { name: 'ws' } } };
  const styleRouter = (call) => (call.method === 'GET' ? { body: styleInfo } : { status: 201 });

  it('assignStyleToLayer: makes the style the default style by default', async () => {
    mock = mockFetch(styleRouter);
    await grc.styles.assignStyleToLayer('ws', 'layer', 'ws', 'my-style');

    expect(mock.calls[0].url).to.equal(url + 'workspaces/ws/styles/my-style.json');
    const post = mock.calls[1];
    expect(post.method).to.equal('POST');
    expect(post.url).to.equal(url + 'layers/ws:layer/styles?default=true');
    expect(bodyOf(post)).to.deep.equal(styleInfo);
  });

  it('assignStyleToLayer: only an explicit false adds the style without making it default', async () => {
    mock = mockFetch(styleRouter);
    await grc.styles.assignStyleToLayer('ws', 'layer', 'ws', 'my-style', false);
    expect(mock.calls[1].url).to.equal(url + 'layers/ws:layer/styles');
    mock.restore();

    mock = mockFetch(styleRouter);
    await grc.styles.assignStyleToLayer('ws', 'layer', 'ws', 'my-style', undefined);
    expect(mock.calls[1].url).to.equal(url + 'layers/ws:layer/styles?default=true');
  });

  it('assignStyleToLayer: works without workspaces', async () => {
    mock = mockFetch(styleRouter);
    await grc.styles.assignStyleToLayer(undefined, 'layer', undefined, 'my-style');

    expect(mock.calls[0].url).to.equal(url + 'styles/my-style.json');
    expect(mock.calls[1].url).to.equal(url + 'layers/layer/styles?default=true');
  });

  it('assignStyleToLayer: throws on errors of the POST', async () => {
    mock = mockFetch((call) =>
      call.method === 'GET' ? { body: styleInfo } : { status: 500, body: 'x' }
    );
    const error = await thrown(() => grc.styles.assignStyleToLayer('ws', 'l', 'ws', 's'));
    expect(error).to.be.instanceOf(GeoServerResponseError);
  });

  const stylesRouter = (call) => {
    if (call.url === url + 'workspaces.json') {
      return { body: { workspaces: { workspace: [{ name: 'a' }, { name: 'b' }] } } };
    }
    if (call.url === url + 'workspaces/a/styles.json') {
      return { body: { styles: { style: [{ name: 'a1' }, { name: 'a2' }] } } };
    }
    if (call.url === url + 'workspaces/b/styles.json') {
      return { body: { styles: '' } }; // GeoServer: no styles in this workspace
    }
    if (call.url === url + 'styles.json') {
      return { body: { styles: { style: [{ name: 'point' }] } } };
    }
    return { status: 404 };
  };

  it('getAllWorkspaceStyles: collects the styles of all workspaces', async () => {
    mock = mockFetch(stylesRouter);
    expect(await grc.styles.getAllWorkspaceStyles()).to.deep.equal([
      { name: 'a1' },
      { name: 'a2' }
    ]);
  });

  it('getAll: puts the default styles first', async () => {
    mock = mockFetch(stylesRouter);
    expect(await grc.styles.getAll()).to.deep.equal([
      { name: 'point' },
      { name: 'a1' },
      { name: 'a2' }
    ]);
  });

  it('getAll: rejects malformed default styles', async () => {
    mock = mockFetch((call) =>
      call.url === url + 'styles.json' ? { body: { styles: '' } } : stylesRouter(call)
    );
    const error = await thrown(() => grc.styles.getAll());
    expect(error).to.be.instanceOf(GeoServerResponseError);
    expect(error.message).to.contain('malformed');
  });
});

describe('Layergroups (unit)', () => {
  it('create: sends the published layers and default styles', async () => {
    mock = mockFetch(() => ({ status: 201, headers: { location: 'http://gs/lg' } }));
    await grc.layergroups.create('ws', 'lg', ['a', 'b']);

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.contain('workspaces/ws/layergroups');
    const { layerGroup } = bodyOf(call);
    expect(layerGroup.name).to.equal('lg');
    expect(layerGroup.workspace).to.deep.equal({ name: 'ws' });
    expect(layerGroup.mode).to.equal('SINGLE');
    expect(layerGroup.publishables.published.map((p) => p.name)).to.deep.equal(['ws:a', 'ws:b']);
    expect(layerGroup.publishables.published.every((p) => p['@type'] === 'layer')).to.equal(true);
    expect(layerGroup.styles.style).to.deep.equal(['', '']);
  });

  it('create: options override mode and title', async () => {
    mock = mockFetch(() => ({ status: 201 }));
    await grc.layergroups.create('ws', 'lg', ['a'], { mode: 'NAMED', layerGroupTitle: 'Title' });

    const { layerGroup } = bodyOf(mock.calls[0]);
    expect(layerGroup.mode).to.equal('NAMED');
    expect(layerGroup.layerGroupTitle).to.equal('Title');
  });

  it('get: undefined on 404 if GeoServer is reachable', async () => {
    mock = mockFetch(geoServerUpButNotFound);
    expect(await grc.layergroups.get('ws', 'fantasy')).to.be.undefined;
    expect(mock.calls[0].url).to.contain('workspaces/ws/layergroups/fantasy.json');
  });

  it('update: puts the definition', async () => {
    mock = mockFetch(() => ({}));
    const definition = { layerGroup: { name: 'lg', mode: 'OPAQUE_CONTAINER' } };
    await grc.layergroups.update('ws', 'lg', definition);

    const [call] = mock.calls;
    expect(call.method).to.equal('PUT');
    expect(call.url).to.contain('workspaces/ws/layergroups/lg.json');
    expect(bodyOf(call)).to.deep.equal(definition);
  });

  it('update: throws on errors', async () => {
    await expectFailure(
      () => grc.layergroups.update('ws', 'lg', {}),
      { status: 500, body: 'x' },
      GENERIC
    );
  });
});

describe('Layer reads and coverage requests (unit)', () => {
  it('getCoverageFromLayer: asks for the coverage of the workspace', async () => {
    mock = mockFetch(() => ({ body: { coverage: { name: 'c' } } }));
    await grc.layers.getCoverageFromLayer('ws', 'c');
    expect(mock.calls[0].url).to.contain('workspaces/ws/coverages/c.json');
  });

  it('getCoverageStore: follows coverage.store.href', async () => {
    const href = 'http://gs.test/geoserver/rest/workspaces/ws/coveragestores/cs.json';
    mock = mockFetch((call) =>
      call.url === href
        ? { body: { coverageStore: { name: 'cs' } } }
        : { body: { coverage: { store: { name: 'ws:cs', href } } } }
    );
    const result = await grc.layers.getCoverageStore('ws', 'c');

    expect(result.coverageStore.name).to.equal('cs');
    expect(mock.calls[1].url).to.equal(href);
  });

  it('getDataStore: follows featureType.store.href', async () => {
    const ftHref = 'http://gs.test/ft.json';
    const dsHref = 'http://gs.test/ds.json';
    mock = mockFetch((call) => {
      if (call.url === dsHref) return { body: { dataStore: { name: 'ds' } } };
      if (call.url === ftHref)
        return { body: { featureType: { store: { name: 'ws:ds', href: dsHref } } } };
      return { body: { layer: { resource: { href: ftHref } } } };
    });
    const result = await grc.layers.getDataStore('ws', 'layer');

    expect(result.dataStore.name).to.equal('ds');
    expect(mock.calls.map((c) => c.url).slice(1)).to.deep.equal([ftHref, dsHref]);
  });

  it('deleteFeatureType: throws on errors', async () => {
    await expectFailure(
      () => grc.layers.deleteFeatureType('ws', 'st', 'ft', true),
      { status: 500, body: 'x' },
      GENERIC
    );
  });
});

// ---------------------------------------------------------------------------
// Image mosaic and reset/reload
// ---------------------------------------------------------------------------

describe('ImageMosaic (unit)', () => {
  const external = 'workspaces/ws/coveragestores/cs/external.imagemosaic';

  it('harvestGranules: posts the folder as plain text and returns the JSON', async () => {
    mock = mockFetch(() => ({ body: { granules: [] } }));
    expect(await grc.imagemosaics.harvestGranules('ws', 'cs', '/data/mosaic')).to.deep.equal({
      granules: []
    });

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.equal(url + external);
    expect(headerOf(call, 'content-type')).to.equal('text/plain');
    expect(call.body).to.equal('/data/mosaic');
  });

  it('addGranuleByServerFile: posts the file path as plain text', async () => {
    mock = mockFetch(() => ({ status: 202 }));
    await grc.imagemosaics.addGranuleByServerFile('ws', 'cs', '/data/granule.tif');

    const [call] = mock.calls;
    expect(call.method).to.equal('POST');
    expect(call.url).to.equal(url + external);
    expect(headerOf(call, 'content-type')).to.equal('text/plain');
    expect(call.body).to.equal('/data/granule.tif');
  });

  it('deleteSingleGranule: filters by file location and returns true', async () => {
    mock = mockFetch(() => ({}));
    expect(await grc.imagemosaics.deleteSingleGranule('ws', 'cs', 'c', 'granule.tif')).to.equal(
      true
    );

    const [call] = mock.calls;
    expect(call.method).to.equal('DELETE');
    expect(call.url).to.equal(
      url +
        "workspaces/ws/coveragestores/cs/coverages/c/index/granules.xml?filter=location='granule.tif'"
    );
  });

  it('write methods throw on errors', async () => {
    await expectFailure(
      () => grc.imagemosaics.harvestGranules('ws', 'cs', '/x'),
      { status: 500, body: 'x' },
      GENERIC
    );
    await expectFailure(
      () => grc.imagemosaics.addGranuleByServerFile('ws', 'cs', '/x'),
      { status: 500, body: 'x' },
      GENERIC
    );
    await expectFailure(
      () => grc.imagemosaics.deleteSingleGranule('ws', 'cs', 'c', 'x'),
      { status: 500, body: 'x' },
      GENERIC
    );
  });
});

describe('Reset and reload (unit)', () => {
  it('reset: posts to /reset', async () => {
    mock = mockFetch(() => ({}));
    await grc.resetReload.reset();
    expect(mock.calls[0].method).to.equal('POST');
    expect(mock.calls[0].url).to.equal(url + 'reset');
  });

  it('reload: posts to /reload', async () => {
    mock = mockFetch(() => ({}));
    await grc.resetReload.reload();
    expect(mock.calls[0].method).to.equal('POST');
    expect(mock.calls[0].url).to.equal(url + 'reload');
  });

  it('throw on errors', async () => {
    await expectFailure(() => grc.resetReload.reset(), { status: 500, body: 'x' }, GENERIC);
    await expectFailure(() => grc.resetReload.reload(), { status: 500, body: 'x' }, GENERIC);
  });
});
