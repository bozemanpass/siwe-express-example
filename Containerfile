FROM aztecprotocol/foundry:25f24e677a6a32a62512ad4f561995589ac2c7dc AS foundry

FROM node:24-bookworm
COPY --from=foundry /opt/foundry/bin/* /usr/local/bin/

RUN apt-get update
RUN apt-get install -y wget jq curl
RUN rm -rf /var/lib/apt/lists/*
WORKDIR /tmp

COPY . /app
WORKDIR /app

RUN npm run dist-clean
RUN npm install
RUN npm run build

EXPOSE 3200
ENTRYPOINT ["/app/run.sh"]