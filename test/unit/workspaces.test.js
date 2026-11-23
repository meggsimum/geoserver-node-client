// test/unit/workspaces.test.js
/* global describe:false, it:false, afterEach:false */
import { expect } from 'chai';
import { GeoServerRestClient } from '../../geoserver-rest-client.js';
import { mockFetch } from './helpers/mock-fetch.js';

const url = 'http://gs.test/geoserver/rest/';
const grc = new GeoServerRestClient(url, 'admin', 'geoserver');

describe('Workspaces (unit)', () => {
  let mock;
  afterEach(() => mock?.restore());

  // TODO fails, maybe because of GeoServerResponseError
  // it('returns undefined for a 404', async () => {
  //   mock = mockFetch(() => ({ status: 404, body: 'No such workspace' }));
  //   expect(await grc.workspaces.get('fantasy')).to.be.undefined;
  // });

  it('sends basic auth and targets the right URL', async () => {
    mock = mockFetch(() => ({ body: { workspace: { name: 'ws' } } }));
    await grc.workspaces.get('ws');

    const [call] = mock.calls;
    expect(call.url).to.equal(`${url}workspaces/ws.json`);
    const auth = new Headers(call.headers).get('authorization');
    expect(auth).to.equal('Basic ' + Buffer.from('admin:geoserver').toString('base64'));
  });
});
