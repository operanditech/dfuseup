FROM ubuntu:18.04
RUN apt-get update \
    && apt-get install -y --no-install-recommends wget ca-certificates software-properties-common \
    && wget https://github.com/EOSIO/eosio.cdt/releases/download/v1.7.0/eosio.cdt_1.7.0-1-ubuntu-18.04_amd64.deb \
    && apt install -y ./eosio.cdt_1.7.0-1-ubuntu-18.04_amd64.deb \
    && wget https://github.com/dfuse-io/eos/releases/download/v2.0.6-dm-12.0/eosio_2.0.6-dm.12.0-1-ubuntu-18.04_amd64.deb \
    && apt install -y ./eosio_2.0.6-dm.12.0-1-ubuntu-18.04_amd64.deb \
    && wget https://github.com/dfuse-io/dfuse-eosio/releases/download/v0.1.0-beta6/dfuse-eosio_0.1.0-beta6_linux_x86_64.tar.gz \
    && tar -xzvf dfuse-eosio_0.1.0-beta6_linux_x86_64.tar.gz \
    && rm dfuse-eosio_0.1.0-beta6_linux_x86_64.tar.gz \
    && rm eosio_2.0.6-dm.12.0-1-ubuntu-18.04_amd64.deb \
    && rm eosio.cdt_1.7.0-1-ubuntu-18.04_amd64.deb \
    && mv dfuseeos /usr/local/bin/dfuseeos \
    && (echo "y" && cat) | dfuseeos init \
    && sed -i 's/127.0.0.1:8888/0.0.0.0:8888/g' /producer/config.ini \
    && apt-get remove -y wget ca-certificates \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && cd /usr/opt/eosio.cdt/1.7.0/bin \
    # Hack to fix multithreading issue in eosio.cdt 1.7.0
    && mv wasm-ld wasm-ld.real \
    && echo '#!/bin/bash' > wasm-ld \
    && echo '`dirname $0`/wasm-ld.real --no-threads "$@"' >> wasm-ld \
    && chmod +x /usr/opt/eosio.cdt/1.7.0/bin/wasm-ld
