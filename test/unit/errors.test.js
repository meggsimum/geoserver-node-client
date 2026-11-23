// test/unit/errors.test.js
/* global describe:false, it:false, afterEach:false */
import { expect } from 'chai';
import { GeoServerRestClient } from '../../geoserver-rest-client.js';
import { mockFetch } from './helpers/mock-fetch.js';

const grc = new GeoServerRestClient('http://gs.test/geoserver/rest/', 'admin', 'geoserver');

describe('Error handling (unit)', () => {
  let mock;
  afterEach(() => mock?.restore());

  it('throws GeoServerResponseError on a 500 and keeps the output', async () => {
    mock = mockFetch(() => ({ status: 500, body: '<html>boom</html>' }));
    try {
      await grc.styles.delete('ws', 'style', true, false);
      expect.fail('should have thrown');
    } catch (error) {
      expect(error.name).to.equal('GeoServerResponseError');
      expect(error.geoServerOutput).to.contain('boom');
    }
  });
});
