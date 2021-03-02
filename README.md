# geoserver-node-client

Node.js client for GeoServer REST API.

**CAUTION: This is highly bleeding edge, heavily under development and therefore breaking changes can be made at every time!**

### Installation

```shell
git clone https://github.com/chrismayer/geoserver-node-client

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

* Christian Mayer (meggsimum) - info __at## meggsimum ~~dot** de
