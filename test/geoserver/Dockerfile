FROM docker.osgeo.org/geoserver:2.21.2

ARG COMMUNITY_VERSION=2.21
ARG COG_NAME=cog
ARG COG_ZIP_NAME=geoserver-$COMMUNITY_VERSION-SNAPSHOT-cog-plugin.zip
ARG EXTENSIONS_PATH=/opt/additional_libs

WORKDIR /tmp
# https://build.geoserver.org/geoserver/2.21.x/community-latest/geoserver-2.21-SNAPSHOT-cog-plugin.zip
RUN wget https://build.geoserver.org/geoserver/$COMMUNITY_VERSION.x/community-latest/$COG_ZIP_NAME && \
    mkdir -p /tmp/$COG_NAME && \
    # folder does not exist at point
    mkdir -p $EXTENSIONS_PATH && \
    unzip ./$COG_ZIP_NAME -d ./$COG_NAME && \
    mv ./$COG_NAME/*.jar $EXTENSIONS_PATH && \
    # tidy up
    rm -rf $COG_NAME && rm *.zip