ARG GEOSERVER_VERSION
FROM docker.osgeo.org/geoserver:${GEOSERVER_VERSION}

ARG GEOSERVER_COMMUNITY_VERSION
ARG COG_NAME=cog
ARG COG_ZIP_NAME=geoserver-${GEOSERVER_COMMUNITY_VERSION}-SNAPSHOT-cog-plugin.zip
ARG EXTENSIONS_PATH=/opt/additional_libs

WORKDIR /tmp
RUN wget https://build.geoserver.org/geoserver/${GEOSERVER_COMMUNITY_VERSION}.x/community-latest/${COG_ZIP_NAME} && \
    mkdir -p /tmp/${COG_NAME} && \
    # folder does not exist at point
    mkdir -p ${EXTENSIONS_PATH} && \
    unzip ./${COG_ZIP_NAME} -d ./${COG_NAME} && \
    mv ./${COG_NAME}/*.jar ${EXTENSIONS_PATH} && \
    # tidy up
    rm -rf ${COG_NAME} && rm *.zip
