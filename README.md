# GeoServer Node Client

[![npm version](https://badge.fury.io/js/geoserver-node-client.svg)](https://www.npmjs.com/package/geoserver-node-client)
[![Website](https://img.shields.io/website?up_message=API-Docs&url=https%3A%2F%2Fmeggsimum.github.io%2Fgeoserver-node-client%2F)](https://meggsimum.github.io/geoserver-node-client)
![GitHub Release Date](https://img.shields.io/github/release-date/meggsimum/geoserver-node-client)
![GitHub last commit](https://img.shields.io/github/last-commit/meggsimum/geoserver-node-client)
![CI Badge](https://github.com/meggsimum/geoserver-node-client/actions/workflows/ci-geoserver-node-client.yml/badge.svg)

![GeoSever Node Client Logo](/img/geoserver-node-client-logo_150px.png)

Node.js / JavaScript Client for the [GeoServer REST API](https://docs.geoserver.org/stable/en/user/rest/).

## API-Docs

Detailed [API-Docs](https://meggsimum.github.io/geoserver-node-client/) are automatically created with JSDoc.

## Meta information

Compatible with [GeoServer](https://geoserver.org)

- v2.28.x
- v2.27.x
- v2.26.x (no more maintained and officially deprecated)
- v2.25.x (no more maintained and officially deprecated)
- v2.24.x (no more maintained and officially deprecated)
- v2.23.x (no more maintained and officially deprecated)
- v2.22.x (no more maintained and officially deprecated)
- v2.21.x (no more maintained and officially deprecated)
- v2.20.x (no more maintained and officially deprecated)
- v2.19.x (no more maintained and officially deprecated)
- v2.18.x (no more maintained and officially deprecated)
- v2.17.x (no more maintained and officially deprecated)

## Usage

```shell
npm i geoserver-node-client
```

usage with require (ES5):

```js
var grcImport = require('geoserver-node-client');
var GeoServerRestClient = grcImport.GeoServerRestClient;

var url = 'http://localhost:8080/geoserver/rest/';
var user = 'admin';
var pw = 'geoserver';
var grc = new GeoServerRestClient(url, user, pw);

function main () {
    grc.about.exists().then(function (result) {
      console.log(result);
    });
};

main();
```

usage as ES module (ES6)

```js
import {GeoServerRestClient} from 'geoserver-node-client';

const url = 'http://localhost:8080/geoserver/rest/';
const user = 'admin';
const pw = 'geoserver';
const grc = new GeoServerRestClient(url, user, pw);

async function main () {
    const result =  await grc.about.exists();
    console.log(result);
};

main();
```

## Setup

Run as local checkout (mainly for development purposes)

```shell
git clone https://github.com/meggsimum/geoserver-node-client

cd geoserver-node-client

npm install

npm run demo
```

## Error Handling

A request either succeeds or throws the custom `GeoServerResponseError`. It has the standard `message` property with a "human-readable" text. Additionally the error has the property `geoServerOutput` which contains the direct response from GeoServer. This output is not guaranteed to exist and can either be a simple text or a complete HTML document. The latter is difficult to read, but might still be helpful for debugging. This example shows how these error properties can be used. It also shows how to filter by error type:

```javascript
  try {
      // call any function from this library
      await grc.styles.publish(workspace, styleName, sldBody)
    } catch (error) {
      // the standard error message
      console.error(error.message);

      // the whole error including stack trace and (if available) the property 'geoServerOutput'
      console.error(error);

      if (error instanceof GeoServerResponseError) {
        // a GeoServer specific error happened
      } else {
        // another error happened
      }
    }
```

## Unit Tests

First start a test setup using this Docker compose file:

```shell
docker-compose -f test/docker-compose.yml up
```

Then, in an other terminal, run:

```shell
# specify the GeoServer version and run the test suite
GEOSERVER_VERSION=2.20.4 npm run test
```

## Release

Setting a git tag and increasing the version in the `package.json` as well as releasing to npm is done via [release-it](https://github.com/release-it/release-it).

The GitHub release has to be performed manually based on the tag created by `release-it`.

This is the workflow for releasing:

1. Make sure a `GITHUB_TOKEN` is available as environment variable. See [here](https://github.com/release-it/release-it/blob/master/docs/github-releases.md) for more information.

```shell
export GITHUB_TOKEN=ADD-YOUR-TOKEN-HERE
```

2. Make sure you are logged in to npm and ensure you have the rights to make a release.

```shell
npm login
# then enter your credentials
```

3. Locally checkout the latest `master` branch that you would like to release, then run:

```shell
npm run release
```

4. Follow the questions in the commandline.

- automatically upgrades the version in `package.json`
- makes a release commit and pushes it to GitHub
- publishes the new version to npm

## Who do I talk to?

You need professional support, maintenance or project-driven development around ***geoserver-node-client***? Please contact a service provider listed below:

- meggsimum (Christian Mayer) - info __at## meggsimum ~~dot** de

## Credits

This project was initiated by [meggsimum](https://meggsimum.de) within the [mFund](https://www.bmv.de/EN/Topics/Digital-Matters/mFund/mFund.html) research project **SAUBER**  and was further developed in the mFund research project **KLIPS**.
