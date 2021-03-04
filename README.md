# GeoServer Node Client

Node.js client for the GeoServer REST API.

**CAUTION: This is highly bleeding edge, heavily under development and therefore breaking changes can be made at every time!**

### API-Docs ###

Detailed API-Docs can be found [here](https://meggsimum.github.io/geoserver-node-client/index.html).

### Installation

```shell
git clone https://github.com/meggsimum/geoserver-node-client

cd geoserver-node-client

npm install

npm run demo
```


### Tests

First start GeoServer using this Docker container.

```shell
docker run \
  -p 8080:8080 \
  -v /path/to/geoserver_mnt:/opt/geoserver_data \
  meggsimum/geoserver:2.17.5
```

Then, in an other terminal, run:

```shell
npm run test
```

### Who do I talk to? ###

* meggsimum (Christian Mayer) - info __at## meggsimum ~~dot** de
